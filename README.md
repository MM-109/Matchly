# Matchly

Matchly is a compatibility-first matchmaking web application designed to create meaningful and intentional connections. Unlike traditional dating apps, Matchly uses a controlled, staged interaction process where user information is revealed only after mutual interest is confirmed.

---

## Features

- User authentication (signup/login)
- Protected routes for secure access
- Questionnaire-based matchmaking system
- Matches page to explore potential connections
- Offers system (send/receive offers)
- Exchange system (mutual acceptance required)
- Controlled reveal of user data for privacy
- Profile image upload support
- Responsive design (mobile, tablet, desktop)
- Loading and empty states for better UX

---

## Technical Stack

### Frontend
- React (with Hooks)
- React Router
- Vite

### Backend & Services
- Firebase Authentication
- Firestore Database
- Firebase Storage
- Firebase Cloud Functions

### APIs & Integrations
- JotForm (questionnaire data collection)
- SendGrid (email exchange functionality)

### Deployment
- Vercel

---

## API Usage

### Firebase
- Authentication for user login/signup
- Firestore for storing users, offers, matches, and exchange data
- Storage for profile images

### JotForm
- Collects questionnaire responses
- Data is synced into Firestore

### SendGrid
- Sends email notifications when both users agree to move forward

---

## Known Issues

- Exchange logic required multiple fixes before working consistently
- Firestore rules needed several adjustments during development
- Deployment issues between local and production environments
- Environment variables setup caused initial errors in Cloud Functions

---

## Core Functionality

Matchly uses a structured matchmaking process:

1. Users complete a questionnaire  
2. Matches are generated  
3. Users send/receive offers  
4. Mutual acceptance moves users to the Exchange stage  
5. Contact information is revealed only after both agree  

This ensures privacy and intentional interaction.

---

## Design and User Experience

- Soft color palette to create a calm interface
- Clean card-based layout for readability
- Responsive UI across all screen sizes
- Clear user feedback with loading and empty states

---

## Reflection

One of the biggest challenges in developing Matchly was integrating multiple systems into one cohesive flow. The app required authentication, routing, database management, API integration, and frontend logic to work together seamlessly.

A major difficulty was implementing the staged matchmaking process. Unlike traditional apps, Matchly required multiple steps before revealing user information. This required careful coordination between Firestore data, UI behavior, and routing logic.

Firebase introduced challenges with Firestore rules and Cloud Functions, especially when setting up SendGrid for email functionality. Deployment also created issues where the app worked locally but failed in production, requiring debugging of environment variables and project structure.

Overall, this project strengthened skills in React, state management, Firebase, API integration, and debugging, while emphasizing the importance of user flow and real-world deployment challenges.

---
