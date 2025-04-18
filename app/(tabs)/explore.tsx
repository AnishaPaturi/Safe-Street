import { StyleSheet, Image, Platform, ScrollView, Text } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedView } from '@/components/ThemedView';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}>
      <ThemedView style={styles.imageContainer}>
        <Image source={require('@/assets/images/uploaded_image.png')} style={styles.image} />
      </ThemedView>
      <ScrollView style={styles.textContainer}>
        <Text style={styles.heading}>Project Overview</Text>
        <Text style={styles.paragraph}>
          This project involves the development of a structured application with distinct roles—Worker and Supervisor—each having specific functionalities. The application ensures a seamless user experience for reporting and assessing road damage using image processing and location tracking, ultimately facilitating communication between field workers and supervisors.
        </Text>
        
        <Text style={styles.heading}>Role Selection Screen</Text>
        <Text style={styles.paragraph}>
          The Role Selection screen will display two buttons: Worker and Supervisor. A Back button will be provided to allow users to navigate back to the Home Screen. Selecting either role will redirect the user to the Authentication Page.
        </Text>

        <Text style={styles.heading}>Authentication Page</Text>
        <Text style={styles.paragraph}>
          The Authentication Page will feature two options: Sign Up and Login.
        </Text>
        
        <Text style={styles.subheading}>Sign Up</Text>
        <Text style={styles.paragraph}>
          Users will provide the following details:
          - Name
          - Phone Number
          - Email
          - Password
          - Confirm Password
          Upon clicking the Sign Up button, the user will be redirected to the Login Page.
          A "Have an account? Login Here" option will allow users to navigate directly to the Login Page.
        </Text>
        
        <Text style={styles.subheading}>Login</Text>
        <Text style={styles.paragraph}>
          Users will enter their Email and Password to log in. Additional options include:
          - "New user? Sign up here" for account creation.
          - "Forgot password?" for password recovery.
        </Text>
        
        <Text style={styles.subheading}>Password Recovery</Text>
        <Text style={styles.paragraph}>
          If a user forgets their password, they can click "Forgot Password?" to initiate the recovery process. They will be prompted to enter their registered email address, and a One-Time Password (OTP) will be sent to their email. Upon entering the OTP in the application, if the verification is successful, the user will be prompted to set a new password. After resetting the password, they will be redirected to the Login Page to continue.
        </Text>
        
        <Text style={styles.heading}>Worker Dashboard</Text>
        <Text style={styles.subheading}>Capture an Image</Text>
        <Text style={styles.paragraph}>
          Users can click a button labeled "Click Now" to open the camera. They can then capture an image of a pothole or road damage. After capturing the image, a confirmation screen will display the image along with the automatically detected address. If necessary, users can manually edit the address in a text field below the image. Before submission, a "Summarize" button will generate a detailed summary of the image using a Vision Transformer (ViT) model. Clicking "Send to Supervisor" will transmit the image, address, and summary to the Supervisor’s dashboard.
        </Text>
        
        <Text style={styles.subheading}>Upload an Image</Text>
        <Text style={styles.paragraph}>
          Users can select "Upload Image Now" to access their device’s gallery or file system. Once an image is selected, the user will be prompted to enter the address manually or pinpoint the location on an interactive map. At least one of these options must be completed before proceeding. The "Summarize" button will analyze the image and generate a summary report. If the summary is accurate, the user can proceed by clicking "Send to Supervisor", or they may choose "Try Again" if the results are unsatisfactory. After submitting an image, the user will be taken to a confirmation screen with a single "Exit" button, which will redirect them back to the Home Screen.
        </Text>
        
        <Text style={styles.heading}>Supervisor Dashboard</Text>
        <Text style={styles.paragraph}>
          When a Supervisor logs in, they will have access to all recent uploads submitted by Workers. The dashboard will display:
          - Worker Details (Name, Contact Information)
          - Uploaded Image
          - Detected Address
          - Generated Summary Report
          For each reported issue, the Supervisor will have the option to assess the submission and forward it to the relevant authorities via email. The authorities will receive a notification containing all relevant details. After completing the assessments, the Supervisor will be redirected to a confirmation screen with a single "Exit" button, which will return them to the Home Screen.
        </Text>
        
        <Text style={styles.heading}>Conclusion</Text>
        <Text style={styles.paragraph}>
          This structured workflow ensures an efficient process for capturing, analyzing, and reporting road damage. The integration of image recognition technology, location tracking, and automated reporting enhances communication between Workers, Supervisors, and Authorities, facilitating rapid response and maintenance.
        </Text>
      </ScrollView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  image: {
    width: '140%',
    height: undefined,
    aspectRatio: 1.5,
    resizeMode: 'contain',
  },
  textContainer: {
    padding: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  paragraph: {
    fontSize: 14,
    textAlign: 'justify',
    marginTop: 5,
  },
});
