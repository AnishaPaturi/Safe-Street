import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ImageBackground,
  View,
  TextInput,
  Text,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { ThemedText } from '@/components/ThemedText';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker } from 'react-native-maps';
import * as FileSystem from 'expo-file-system';
import { LocationGeocodedAddress } from 'expo-location';
import { ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';



export default function HomeScreen() 
{
  const [screen, setScreen] = useState('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  // State for sign-up fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [occupation, setOccupation] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [latestUpload, setLatestUpload] = useState<{
    image: string | null;
    location: string | null;
    date: string;
  }>({
    image: null,
    location: null,
    date: '',
  });
  // Animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [address, setAddress] = useState('');
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [selectedAddress, setSelectedAddress] =  useState<LocationGeocodedAddress | null>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [totalReports, setTotalReports] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const [urgentReports, setUrgentReports] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [recentReports, setRecentReports] = useState<{ time: string; message: string }[]>([]);

 
  useEffect(() => {
    const loadRole = async () => {
      const savedRole = await AsyncStorage.getItem('selectedRole');
      if (savedRole) setSelectedRole(savedRole);
    };
    loadRole();
  
    Animated.timing(logoOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }).start(() => {
      Animated.timing(textOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }).start(() => {
        Animated.timing(buttonOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      });
    });
  }, []);
  const convertUriIfNeeded = async (uri: string): Promise<string> => {
    if (uri && uri.startsWith('content://')) {
      const newPath = FileSystem.cacheDirectory + 'converted.jpg';
      await FileSystem.copyAsync({ from: uri, to: newPath });
      return newPath;
    }
    return uri;
  };
  const fetchAISummary = async (): Promise<void> => {
    try {
      console.log('🧠 Starting fetchAISummary');
      console.log('Original Image URI:', latestUpload.image);
  
      if (!latestUpload.image) {
        Alert.alert("Error", "No image selected.");
        return;
      }
  
      // Ensure URI is converted properly for file uploads
      const imageUri = await convertUriIfNeeded(latestUpload.image);
      console.log('✅ Processed Image URI:', imageUri);
  
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);
  
      console.log('📤 Sending request to Flask server...');
  
      const aiResponse = await fetch('https://b6ac-2409-40f0-125-c676-58b4-6022-a617-105b.ngrok-free.app/analyze', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
          // ❌ Do NOT set 'Content-Type': it breaks boundary detection
        },
      });
      console.log('📡 Calling Flask at:https://9f19-34-74-236-9.ngrok-free.app/analyze');
      console.log('📥 Response status:', aiResponse.status);
  
      const contentType = aiResponse.headers.get("content-type");
      console.log('📦 Content-Type:', contentType);
  
      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('🔥 Server Error:', errorText);
        throw new Error(`Server Error: ${errorText}`);
      }
  
      if (contentType && contentType.includes("application/json")) {
        const data = await aiResponse.json();
        console.log('✅ AI Response:', data);
        setAiSummary(data.summary || data.caption || '[No summary returned]');
      } else {
        const rawText = await aiResponse.text();
        console.warn('⚠️ Unexpected response:', rawText);
        throw new Error(`Unexpected response format: ${rawText}`);
      }
  
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('⚠️ AI Summary Fetch Error:', msg);
      setAiSummary('[Error generating summary: ' + msg + ']');
    }
  };
  
  useEffect(() => {
    if (screen === 'summary' && latestUpload.image) {
      setAiSummary('');
      fetchAISummary(); // This causes the error if fetchAISummary is defined below
    }
  }, [screen]);
  
  useEffect(() => {
    const testNgrok = async () => {
      try {
        const formData = new FormData(); // Intentionally empty — will return "no image"
        const res = await fetch('https://9f19-34-74-236-9.ngrok-free.app/analyze', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
          },
          body: formData,
        });
  
        const json = await res.json();
        console.log('✅ Ngrok test success:', json);
        Alert.alert('Success 🎉', JSON.stringify(json));
      } catch (err) {
        const msg = err instanceof Error ? err.message : JSON.stringify(err);
        console.error('❌ Ngrok test fetch error:', msg);
        Alert.alert('Test Failed ❌', msg);
      }
    };
  
    testNgrok();
  }, []);
  
  
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => alert('Unable to retrieve location')
    );
  };
  
  const validateAndLogin = async () => {
    setErrorMessage('');
  
    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role before logging in.');
      return;
    }
  
    if (!email.includes('@')) {
      setErrorMessage('Email must contain @');
      return;
    }
  
    if (password.length < 8 || !/\d/.test(password)) {
      setErrorMessage('Password must be at least 8 characters long and contain at least one number');
      return;
    }
  
    try {
      const response = await fetch('https://b6ac-2409-40f0-125-c676-58b4-6022-a617-105b.ngrok-free.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
  
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.error('Response was not valid JSON:', text);
        throw new Error('Server returned invalid response. Try again later.');
      }
      console.log('Login response:', data);
      console.log('Login response:', data);
  
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
  
      if (!data.user || !data.user._id) {
        throw new Error('User not found in response');
      }
  
      Alert.alert('Login Successful', `Welcome, ${data.user.name || 'User'}`);
      setFullName(data.user.name || '');
      setEmail(data.user.email || '');
      // Navigate to correct dashboard
      if (selectedRole === 'Worker') {
        setScreen('workerDashboard');
      } else if (selectedRole === 'Supervisor') {
        setScreen('supervisorDashboard');
      } else {
        setScreen('roleSelection');
      }
  
    } catch (err) {
      console.error('Login Error:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      Alert.alert('Login Error', message);
    }
    
  };
    
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  const validateAndSignUp = async () => {
    console.log('Sign Up button clicked ✅');
  
    // ✅ Check if all fields are filled
    if (!fullName || !phoneNumber || !email || !occupation || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required!');
      return;
    }
  
    // ✅ Validate email
    if (!email.includes('@')) {
      Alert.alert('Error', 'Email must contain @');
      return;
    }
  
    // ✅ Validate password
    if (password.length < 8 || !/\d/.test(password)) {
      Alert.alert('Error', 'Password must be at least 8 characters long and contain at least one number');
      return;
    }
  
    // ✅ Confirm passwords match
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    try {
      const response = await fetch('https://b6ac-2409-40f0-125-c676-58b4-6022-a617-105b.ngrok-free.app/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          phone: phoneNumber,
          email,
          password,
        }),
      });
      const getAddressFromCoords = async (coords: { latitude: number; longitude: number }) => {
        try {
          const [address] = await Location.reverseGeocodeAsync(coords);
          return address;
        } catch (error) {
          console.error("Failed to reverse geocode:", error);
          return null;
        }
      };
      const handleRegionChangeComplete = async (region: { latitude: number; longitude: number }) => {
        setSelectedLocation({ latitude: region.latitude, longitude: region.longitude });
        
        const address = await getAddressFromCoords(region);
        setSelectedAddress(address); // You’ll need to add this to state
      };
      
  
      // ✅ Try parsing response as JSON safely
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.error('Invalid JSON from server:', text);
        throw new Error('Unexpected server response');
      }
  
      console.log('Signup response:', data);
  
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }
  
      Alert.alert('Success', 'Sign Up Successful. Redirecting to Login...');
      setScreen('login');
    }catch (err) {
      console.error('Signup Error:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      Alert.alert('Signup Error', message);
    }    
  };
  
  
  const takePicture = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take pictures.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  const extractLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location access is required to get image location.');
      return;
    }
  
    let loc = await Location.getCurrentPositionAsync({});
    let reverseGeocode = await Location.reverseGeocodeAsync(loc.coords);
  
    if (reverseGeocode.length > 0) {
      let address = reverseGeocode[0];
  
      setLocation(
        `${address.name ? address.name + ', ' : ''}` +
        `${address.street ? address.street + ', ' : ''}` +
        `${address.postalCode ? address.postalCode + ', ' : ''}` +
        `${address.city ? address.city + ', ' : ''}` +
        `${address.region ? address.region + ', ' : ''}` +
        `${address.country ? address.country : ''}`
      );
    } else {
      setLocation("Location not found");
    }
  };
  const sendOtpToEmail = async () => {
    if (!email.includes('@')) {
      return Alert.alert('Invalid Email', 'Please enter a valid email address');
    }
  
    try {
      const res = await fetch('https://b6ac-2409-40f0-125-c676-58b4-6022-a617-105b.ngrok-free.app/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
  
      const data = await res.json();
      if (!res.ok) return Alert.alert('Error', data.error || 'Something went wrong');
  
      Alert.alert('OTP Sent ✅', 'Check your email for the OTP');
    } catch (err) {
      Alert.alert('Error', 'Server error');
    }
  };
  
  
  const MapContainerComponent = ({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) => {
    return (
      <MapView
        style={{ height: 200, width: '100%' }}
        initialRegion={{
          latitude: position?.[0] ?? 22.9734,
          longitude: position?.[1] ?? 78.6569,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={async (e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          setPosition([latitude, longitude]);

          try {
            const [addr] = await Location.reverseGeocodeAsync({ latitude, longitude });
            setAddress(
              `${addr.name ? addr.name + ', ' : ''}` +
              `${addr.street ? addr.street + ', ' : ''}` +
              `${addr.postalCode ? addr.postalCode + ', ' : ''}` +
              `${addr.city ? addr.city + ', ' : ''}` +
              `${addr.region ? addr.region + ', ' : ''}` +
              `${addr.country ? addr.country : ''}`
            );
          } catch (error) {
            console.error("Reverse geocoding failed:", error);
          }
        }}
      >
        {position && (
          <Marker coordinate={{ latitude: position[0], longitude: position[1] }} />
        )}
      </MapView>

    );
  };
  
  
  // Function to verify OTP
  const verifyOTP = async () => {
    try {
      const res = await fetch('https://b6ac-2409-40f0-125-c676-58b4-6022-a617-105b.ngrok-free.app/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
  
      const data = await res.json();
      if (!res.ok) return Alert.alert('Error', data.error || 'Invalid OTP');
  
      Alert.alert('Verified!', 'OTP verified successfully');
      setScreen('resetPassword'); // ✅ transition to reset screen
    } catch (err) {
      Alert.alert('Error', 'Server error');
    }
  };
  

  const handleSummaryClick = () => {
    setLatestUpload({
      image: image,
      location: position
        ? `Latitude: ${position[0]}, Longitude: ${position[1]}`
        : 'No location',
      date: new Date().toLocaleDateString(),
    });    
    setScreen('summary');
  };
  
  const handleSummaryNavigation = () => {
    if (!image || !address) {
      Alert.alert("Error", "Please select image and location.");
      return;
    }
    setLatestUpload({
      image,
      location: address || location || 'No location provided',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    });
    
        setScreen('summary');
  };
  const uploadToServer = async () => {
    let formData: FormData;
  
    try {
      // Create a new FormData object
      formData = new FormData();
      formData.append('userId', 'anishapaturi481');
  
      // Handle location being null
      formData.append('location', latestUpload.location || '');
      formData.append('summary', aiSummary || '');
  
      // Ensure the image object is correctly formatted
      if (latestUpload.image) {
        formData.append('image', {
          uri: latestUpload.image,
          name: 'upload.jpg',
          type: 'image/jpeg',
        } as any); // Use `as any` to cast it to an acceptable type if necessary
      } else {
        Alert.alert("Missing Image", "No image to upload.");
        return;
      }
    } catch (error) {
      console.error('Error while appending data to FormData:', error);
      return; // Exit the function if there was an error creating formData
    }
  
    try {
      if (!latestUpload.location || !aiSummary || !latestUpload.image) {
        Alert.alert("Upload Error", "Missing one or more required fields.");
        return;
      }
    
      console.log("Uploading with:");
      console.log("userId:", 'anishapaturi481');
      console.log("location:", latestUpload.location);
      console.log("summary:", aiSummary);
      console.log("image:", latestUpload.image);
      // Perform the fetch request with FormData
      const res = await fetch('https://b6ac-2409-40f0-125-c676-58b4-6022-a617-105b.ngrok-free.app/api/upload/new', {
        method: 'POST',
        body: formData, // body should be the formData object
      });
  
      const text = await res.text();
      let data;
  
      // Attempt to parse the response text as JSON
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Upload failed: Invalid server response');
      }
  
      // If the response is not OK, throw an error
      if (!res.ok) throw new Error(data.error || 'Upload failed');
  
      // If everything goes well
      Alert.alert("Success", "Upload sent to Supervisor");

      // ✅ Update recent reports
      const newReport = {
        time: new Date().toLocaleTimeString(),
        message: aiSummary || '[No summary]',
      };
      
      setRecentReports((prev) => [newReport, ...prev.slice(0, 4)]);

        setScreen('workerDashboard');
      } catch (err: unknown) {
        // Type the error as an instance of Error
        if (err instanceof Error) {
          console.error("Upload Error:", err);
          Alert.alert("Upload Failed", err.message);
        } else {
          console.error("Unknown error:", err);
          Alert.alert("Upload Failed", "An unknown error occurred");
        }
      }
    };
  const handleNewReport = (isUrgent: boolean) => {
    setTotalReports(prev => prev + 1);
    setPendingReports(prev => prev + 1);  // Mark as pending by default
  
    if (isUrgent) {
      setUrgentReports(prev => prev + 1); // Only increment if the report is urgent
    }
  };

  // Function to reset password
  const resetPassword = async () => {
    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      return Alert.alert(
        'Invalid Password',
        'Password must be at least 8 characters long and contain a number.'
      );
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert('Password Mismatch', 'Passwords do not match.');
    }

    try {
      const res = await fetch('https://b6ac-2409-40f0-125-c676-58b4-6022-a617-105b.ngrok-free.app/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        return Alert.alert('Error', data.error || 'Failed to reset password.');
      }

      Alert.alert('Success', 'Password updated successfully.');
      setScreen('login');
    } catch (error) {
      Alert.alert('Error', 'Server error. Please try again later.');
    }
  };
 
  
  
  
  return (
    <ImageBackground source={require('@/assets/images/potholeclick.png')} style={styles.background}>
      {screen === 'home' && (
        <ImageBackground source={require('@/assets/images/potholeclick.png')} style={styles.background}>
          <View style={styles.HomeContainer}>
            <Animated.View style={[styles.homeInnerContainer, { opacity: logoOpacity }]}>
              <Animated.Image
                source={require('@/assets/images/logo.png')}
                style={[styles.logo, { opacity: logoOpacity }]}
              />
              <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
                <ThemedText type="title" style={styles.title}>Safe Street</ThemedText>
                <ThemedText type="subtitle" style={styles.tagline}>Making roads safer, one step at a time</ThemedText>
              </Animated.View>
              <Animated.View style={{ opacity: buttonOpacity }}>
                <TouchableOpacity style={styles.startButton} onPress={() => setScreen('roleSelection')}>
                  <ThemedText type="defaultSemiBold" style={styles.buttonText}>Start</ThemedText>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>
        </ImageBackground>
      )}
      {screen === 'auth' && (
        <View style={styles.AuthContainer}>
          <ThemedText type="title" style={styles.authTitle}>
            {selectedRole ? `${selectedRole} Authentication` : 'Authentication'}
          </ThemedText>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.authButton} onPress={() => setScreen('login')}>
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>Login</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.authButton} onPress={() => setScreen('signup')}>
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>Sign Up</ThemedText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.authBackButton} onPress={() => setScreen('roleSelection')}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      )}
      {screen === 'login' && (
        <View style={styles.LoginContainer}>
          <ThemedText type="title" style={styles.authTitle}>
            {selectedRole ? `${selectedRole} Login` : 'Login'}
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Enter Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          
          <TouchableOpacity style={styles.submitButton} onPress={validateAndLogin}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>Submit</ThemedText>
          </TouchableOpacity>
          {/* Forgot Password */}
          <TouchableOpacity onPress={() => setScreen('forgotPassword')}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
          {/* Signup Link */}
          <TouchableOpacity onPress={() => setScreen('signup')}>
            <Text style={styles.linkText}>Don't have an account? <Text style={styles.boldText}>Sign up here</Text></Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.authBackButton} onPress={() => setScreen('auth')}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      )}
      {screen === 'forgotPassword' && (
        <View style={styles.forgotPasswordcontainer}>
          <View style={styles.forgotPasswordcard}>
            <Text style={styles.title}>🔐 Enter Your Email</Text>
            <TextInput
              style={styles.input}
              placeholder="example@mail.com"
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.submitButton} onPress={sendOtpToEmail}>
              <Text style={styles.buttonText}>Send OTP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.authBackButton} onPress={() => setScreen('login')}>
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>Back</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {screen === 'otpVerification' && (
        <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.label}>Enter OTP sent to:</Text>
          <Text style={styles.email}>{email}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            keyboardType="numeric"
            onChangeText={setOtp}
          />
          <TouchableOpacity style={styles.button} onPress={verifyOTP}>
            <Text style={styles.buttonText}>Verify OTP</Text>
          </TouchableOpacity>
        </View>
      </View>
  
      )}
      {screen === 'resetPassword' && (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Reset Password</Text>

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry={!showPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry={!showPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.toggle}>
                {showPassword ? 'Hide' : 'Show'} Password
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={resetPassword}>
              <Text style={styles.buttonText}>Reset Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {screen === 'signup' && (
        <View style={styles.SignupContainer}>
          <ThemedText type="title" style={styles.authTitle}>
            {selectedRole ? `${selectedRole} Sign Up` : 'Sign Up'}
          </ThemedText>
          <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
          <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Occupation" value={occupation} onChangeText={setOccupation} />
          <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
          <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
          <TouchableOpacity style={styles.submitButton} onPress={validateAndSignUp}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>Submit</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScreen('login')}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.boldText}>Login here</Text></Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.authBackButton} onPress={() => setScreen('auth')}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      )}
      {/* Role Selection */}
      {screen === 'roleSelection' && (
        <View style={styles.roleContainer}>
          <ThemedText type="title" style={styles.authTitle}>Select Your Role</ThemedText>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.roleButton} 
              onPress={async () => { 
                await AsyncStorage.setItem('selectedRole', 'Worker'); 
                setSelectedRole('Worker'); 
                setScreen('auth'); 
              }}
            >
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>Worker</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.roleButton} 
              onPress={async () => { 
                await AsyncStorage.setItem('selectedRole', 'Supervisor'); 
                setSelectedRole('Supervisor'); 
                setScreen('auth'); 
              }}
            >
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>Supervisor</ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.authBackButton} onPress={() => setScreen('home')}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {screen === 'workerDashboard' && (
        <View style={styles.workerDashboardContainer}>
          <ThemedText type="title" style={styles.authTitle}>Worker Dashboard</ThemedText>
          <TouchableOpacity style={styles.submitButton} onPress={() => setScreen('imageUpload')}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>Upload a Picture</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.authBackButton} onPress={() => setScreen('roleSelection')}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      )}
      {screen === 'imageUpload' && (
        <View style={styles.imageUploadContainer}>
          {!image && (
            <>
              <TouchableOpacity style={styles.submitButton} onPress={takePicture}>
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>Take Picture</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={pickImage}>
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>Upload from Device</ThemedText>
              </TouchableOpacity>
            </>
          )}
          {image && (
            <View>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <TouchableOpacity style={styles.submitButton} onPress={() => setImage(null)}>
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>Retake</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={() => setScreen('manualLocation')}>
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>Enter Location Manually</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={extractLocation}>
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>Get Location</ThemedText>
              </TouchableOpacity>
            </View>
          )}
          {(location || address) && (
            <View>
              {location && (
                <Text style={styles.locationText}>Coordinates: {location}</Text>
              )}
              {address !== '' && (
                <Text style={styles.locationText}>Selected Address: {address}</Text>
              )}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  if (!image || (!address && !location)) {
                    Alert.alert("Error", "Please select an image and add a location before continuing.");
                    return;
                  }
                
                  const finalLocation = address || location || "No location available";
                
                  setLatestUpload({
                    image,
                    location: finalLocation,
                    date: new Date().toLocaleDateString(),
                  });
                  setScreen('summary');
                }}
                
              >
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>Summary</ThemedText>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.authBackButton} onPress={() => setScreen('workerDashboard')}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      )}
      {screen === 'manualLocation' && (
        <View style={styles.manualContainer}>
          <ThemedText type="title" style={styles.heading}>Enter Location</ThemedText>
          <TextInput
            placeholder="Enter address manually"
            value={address}
            onChangeText={setAddress}
            style={styles.manual_input}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.getLocationButton} onPress={() => setScreen('summary')}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>Summary</ThemedText>
          </TouchableOpacity>
          <View style={styles.mapContainer}>
            <View style={{ height: 200, borderRadius: 10, overflow: 'hidden' }}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: position?.[0] || 37.78825,
                  longitude: position?.[1] || -122.4324,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                onPress={async (e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setPosition([latitude, longitude]);
                  try {
                    const [addr] = await Location.reverseGeocodeAsync({ latitude, longitude });
                    setAddress(
                      `${addr.name ? addr.name + ', ' : ''}` +
                      `${addr.street ? addr.street + ', ' : ''}` +
                      `${addr.postalCode ? addr.postalCode + ', ' : ''}` +
                      `${addr.city ? addr.city + ', ' : ''}` +
                      `${addr.region ? addr.region + ', ' : ''}` +
                      `${addr.country ? addr.country : ''}`
                    );
                  } catch (error) {
                    console.error("Reverse geocoding failed:", error);
                  }
                }}
              >
                {position && (
                  <Marker coordinate={{ latitude: position[0], longitude: position[1] }} />
                )}
              </MapView>
            </View>
          </View>
          {address !== '' && (
            <Text style={{ marginTop: 10, fontSize: 16, color: '#000' }}>
              Selected Address: {address}
            </Text>
          )}
          <TouchableOpacity
            style={styles.manual_backButton}
            onPress={() => {
              if (!address) {
                Alert.alert("Error", "Please enter an address.");
                return;
              }
              setLatestUpload((prev) => ({
                ...prev,
                location: address,
              }));
              setScreen('imageUpload');
            }}
            >
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>Done</ThemedText>
          </TouchableOpacity>
        </View>
      )}
      {screen === 'summary' && latestUpload.image && (
        <View style={styles.supervisorViewContainer}>
          <Image source={{ uri: latestUpload.image }} style={styles.previewImage} />
          <Text style={styles.summaryText}>SUMMARY</Text>
          <Text style={styles.locationText}>Name: {fullName || '[Unknown]'}</Text>
          <Text style={styles.locationText}>Email: {email || '[Unknown]'}</Text>
          <Text style={styles.locationText}>Date: {latestUpload.date || '[Not Set]'}</Text>
          <Text style={styles.locationText}>Location: {latestUpload.location}</Text>
          {aiSummary ? (
            <Text style={{ color: 'white', fontSize: 16, marginBottom: 10 }}>{aiSummary}</Text>
          ) : (
            <Text style={{ color: 'white', fontSize: 14 }}>Generating summary...</Text>
          )}
          {/* 👇 Optional, keep if you want metadata line */}
          <TouchableOpacity style={styles.uploadButton} onPress={uploadToServer}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>Upload</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.authBackButton} onPress={() => setScreen('home')}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Supervisor Dashboard */}
      {screen === 'supervisorDashboard' && (
        <ImageBackground
          source={require('@/assets/images/potholeclick.png')}
          style={styles.background}
        >
          <ScrollView
            contentContainerStyle={styles.supervisorDashboardContainer}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type="title" style={styles.authTitle}>
              Supervisor Dashboard
            </ThemedText>

            {/* Summary Cards */}
            <View style={styles.cardRow}>
              <View style={[styles.dashboardCard, { backgroundColor: '#007bff' }]}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Total Reports</ThemedText>
                <ThemedText style={styles.cardValue}>{totalReports}</ThemedText>
              </View>

              <View style={[styles.dashboardCard, { backgroundColor: '#28a745' }]}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Pending</ThemedText>
                <ThemedText style={styles.cardValue}>{pendingReports}</ThemedText>
              </View>

              <View style={[styles.dashboardCard, { backgroundColor: '#dc3545' }]}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Urgent</ThemedText>
                <ThemedText style={styles.cardValue}>{urgentReports}</ThemedText>
              </View>
            </View>

            {/* Map Container */}
            <View style={styles.mapContainer}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Map View</ThemedText>
              <View style={{ height: 200, borderRadius: 10, overflow: 'hidden' }}>
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                >
                  <Marker coordinate={{ latitude: 37.78825, longitude: -122.4324 }} />
                </MapView>
              </View>
            </View>

            {/* Recent Reports */}
            {/* <View style={styles.recentReportsBox}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Recent Updated Reports</ThemedText>
              <View style={styles.reportItem}>
                <ThemedText>15:40 - Report #324 updated: Severity changed to High</ThemedText>
              </View>
              <View style={styles.reportItem}>
                <ThemedText>14:10 - Report #318 updated: Marked as Resolved</ThemedText>
              </View>
              <View style={styles.reportItem}>
                <ThemedText>13:22 - Report #310 updated: Assigned to Worker #45</ThemedText>
              </View>
            </View> */}
            {recentReports.length > 0 && (
              <View style={styles.recentReportsBox}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Recent Updated Reports</ThemedText>
                {recentReports.map((report, index) => (
                  <View key={index} style={styles.reportItem}>
                    <ThemedText>{report.time} - {report.message}</ThemedText>
                  </View>
                ))}
              </View>
            )}


            {/* Back Button */}
            <TouchableOpacity style={styles.authBackButton} onPress={() => setScreen('roleSelection')}>
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>Back</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </ImageBackground>
      )}



      {/* Supervisor View Page - Displays Image & Location */}
      {screen === 'supervisorView' && latestUpload.image && (
        <View style={styles.supervisorViewContainer}>
          <Image source={{ uri: latestUpload.image }} style={styles.previewImage} />
          <Text style={styles.locationText}>Location: {latestUpload.location}</Text>
          {/* <TouchableOpacity 
            style={styles.authBackButton} 
            onPress={() => setScreen('supervisorDashboard')}
          >
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.authBackButton} onPress={() => setScreen('supervisorDashboard')}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' },
  authContainer: { width: '50%', height: '50%', padding: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  authButton: { backgroundColor: 'green', width: 120, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  authBackButton: { marginTop: 20, backgroundColor: 'red', paddingVertical: 10, paddingHorizontal: 40, borderRadius: 8, alignSelf: 'center' },
  roleButton: { backgroundColor: 'green', width: 140, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  submitButton: { marginTop: 10, backgroundColor: 'green', paddingVertical: 10, paddingHorizontal: 40, borderRadius: 8 },
  errorText: { color: 'white', marginBottom: 10, fontSize: 14 }, 
  startButton: { marginTop: 20, backgroundColor: 'green', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 8 },
  backButton: { marginTop: 20, backgroundColor: 'red', paddingVertical: 8, paddingHorizontal: 30, borderRadius: 6 },
  tagline: { fontSize: 16, color: 'white', marginTop: 5, textAlign: 'center' },
  locationText: { marginTop: 10, fontSize: 16, color: 'white' }, 
  previewImage: { width: 200, height: 200, marginVertical: 10 },
  removeButton: { marginTop: 10, backgroundColor: 'blue', paddingVertical: 10, paddingHorizontal: 40, borderRadius: 8, alignItems: 'center' },
  uploadButton: { marginTop: 10, backgroundColor: 'green', paddingVertical: 10, paddingHorizontal: 40, borderRadius: 8, alignItems: 'center' },
  openButton: { marginTop: 10, backgroundColor: 'blue', paddingVertical: 10, paddingHorizontal: 40, borderRadius: 8, alignItems: 'center' },
  logo: {width: 120,height: 120,borderRadius: 60,marginBottom: 20,}, 
  HomeContainer: {width: '90%',padding: 20,backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 },shadowOpacity: 0.3,shadowRadius: 5,},
  roleContainer: {width: '90%',padding: 20,backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 },shadowOpacity: 0.3,shadowRadius: 5,},
  AuthContainer: {width: '90%', maxWidth: 400, padding: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,},
  LoginContainer: {width: '90%', maxWidth: 400, padding: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,},
  SignupContainer: {width: '90%', maxWidth: 400, padding: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,},
  workerDashboardContainer: {width: '90%', maxWidth: 400, padding: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,},
  imageUploadContainer: {width: '90%', maxWidth: 400, padding: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,},
  supervisorViewContainer: {width: '90%', maxWidth: 400, padding: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,},
  linkText: {color: 'white'},
  overlay: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.4)', width: '100%', height: '100%',},
  videoBackground: {position: 'absolute',top: 0,left: 0,right: 0,bottom: 0,width: '100%',height: '100%',zIndex: -1,},
  manualContainer: {width: '90%', maxWidth: 400, padding: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 253, 253, 0.7)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,},
  heading: {fontSize: 22,marginBottom: 16,textAlign: 'center',},
  manual_input: {borderWidth: 1,borderColor: '#ccc',borderRadius: 8,padding: 12,marginBottom: 16,color: '#000',},
  getLocationButton: { backgroundColor: '#16a34a',paddingVertical: 12,borderRadius: 8,alignItems: 'center', marginBottom: 16,},
  mapContainer: {height: 400,width: 300,borderRadius: 8, overflow: 'hidden'},
  coordsText: {textAlign: 'center',fontSize: 14,marginBottom: 16,},
  manual_backButton: {backgroundColor: '#4b5563', paddingVertical: 12, borderRadius: 8, alignItems: 'center',},
  summaryText: {fontSize: 18,fontWeight: 'bold', color: '#007b8f', marginTop: 10, },
  metaText: { marginTop: 20, fontSize: 14, color: '#666', textAlign: 'center',}, 
  boldText: { fontWeight: 'bold', },
  backButtonContainer: { position: 'absolute', top: 20, left: 20, },
  buttonContainer: { flexDirection: 'column',justifyContent: 'center',alignItems: 'center',gap: 15,marginBottom: 20,},
  supervisorDashboardContainer: { padding: 20, backgroundColor: '#f4f4f4', flexGrow: 1, width: '90%', maxWidth: 400, borderRadius: 15, alignItems: 'center', justifyContent: 'center',  shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,},
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20,},
  dashboardCard: { flex: 1, borderRadius: 12, padding: 15, marginHorizontal: 5,},
  cardTitle: { color: '#fff', fontSize: 16,},
  cardValue: {color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 5,},
  authTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: 'white', textAlign: 'center',},
  placeholderBox: { height: 150, backgroundColor: '#e0e0e0', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10,},
  infoRow: { flexDirection: 'column', justifyContent: 'flex-start',marginBottom: 10,},
  notificationBox: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 12,  marginRight: 10,  elevation: 2,},
  chartBox: {  flex: 1,  backgroundColor: '#fff', padding: 15, borderRadius: 12, marginLeft: 10, elevation: 2, },
  sectionTitle: { fontSize: 18, marginBottom: 10, },
  container: { padding: 24, backgroundColor: '#f3f4f6', alignItems: 'center',width: '60%', height: '50%',  borderRadius: 20, justifyContent: 'center',flex: 1},
  card: {shadowColor: '#000',backgroundColor: 'rgba(255,255,255,0.05)', width: '100%', maxWidth: 400, shadowRadius: 10, padding: 24, borderRadius: 16,  elevation: 5,shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 },},
  title: {marginBottom: 20,fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', }, 
  input: {borderColor: '#ccc',width: '100%', height: 50, paddingHorizontal: 50, marginVertical: 8,borderWidth: 1,marginBottom: 15,fontSize: 16,backgroundColor: 'white', borderRadius: 10, padding: 12, },
  button: {borderRadius: 10,backgroundColor: '#10b981', padding: 16,},
  buttonText: { fontSize: 16,textAlign: 'center',  color: 'white', fontWeight: 'bold',},
  label: { color: '#ddd', marginBottom: 6,fontSize: 16 },
  email: { fontSize: 14, marginBottom: 16, color: '#6b7280' },
  toggle: { color: '#38bdf8', textAlign: 'right', marginBottom: 20,},
  homeInnerContainer: {alignItems: 'center',justifyContent: 'center', width: '100%', padding: 20,},
  loginContainer: {flex: 1,alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 60,},
  forgotPasswordcontainer: {flex: 1,alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 60,},
  forgotPasswordcard:{shadowColor: '#000',backgroundColor: 'rgba(0, 0, 0, 0.7)', width: '100%', maxWidth: 400, shadowRadius: 10, padding: 24, borderRadius: 16,  elevation: 5,shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 },},
  recentReportsBox: { backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 15, marginVertical: 20,marginHorizontal: 10, borderRadius: 10, shadowColor: '#000',  shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3, },
  reportItem: { paddingVertical: 6, borderBottomColor: '#ccc', borderBottomWidth: 1,},
});