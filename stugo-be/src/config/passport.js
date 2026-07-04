import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { userRepository } from '../repositories/index.js';
import emailService from '../services/email.service.js';
/**
 * Configure Passport Google OAuth Strategy
 */
const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        scope: ['profile', 'email'],
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || profile._json?.email;
          const googleId = profile.id;
          const fullName = profile.displayName;
          const avatar = profile.photos?.[0]?.value;

          // Find user by Google ID
          let user = await userRepository.findByGoogleId(googleId);

          // If not found by Google ID, try by email
          if (!user && email) {
            user = await userRepository.findByEmail(email);
          }

          if (!user) {
            // Create new user
            user = await userRepository.create({
              email,
              fullName,
              avatar,
              googleId,
              role: 'user',
              status: 'active',
            });
            
            // Send welcome email asynchronously without blocking auth flow
            if (email) {
              emailService.sendWelcomeEmail(email, fullName).catch(err => {
                console.error('Failed to send welcome email (Google Auth):', err);
              });
            }
          } else {
            // Update existing user with Google info if not set
            if (!user.googleId) {
              user = await userRepository.updateById(user._id, {
                googleId,
                avatar: user.avatar || avatar,
              });
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  // Serialize user for session (not using sessions, but required)
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await userRepository.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

export default configurePassport;
