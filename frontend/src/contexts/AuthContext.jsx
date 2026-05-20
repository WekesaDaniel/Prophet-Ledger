// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Handle email confirmation from URL
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      
      if (type === 'signup' || type === 'recovery') {
        if (access_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (!error && data.session) {
            setSession(data.session);
            
            // Extract user data with full_name
            const userData = {
              id: data.session.user.id,
              email: data.session.user.email,
              full_name: data.session.user.user_metadata?.full_name || 
                        data.session.user.user_metadata?.name || 
                        data.session.user.email?.split('@')[0] || 
                        'User',
              email_confirmed: data.session.user.confirmed_at !== null,
              created_at: data.session.user.created_at
            };
            setUser(userData);
            toast.success('Email verified successfully! You can now log in.');
            window.location.hash = '';
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
          }
        }
      }
    };
    
    handleEmailConfirmation();
  }, []);

  // Get initial session and listen for auth changes
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        // Extract user data including full_name from metadata
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || 
                      session.user.user_metadata?.name || 
                      session.user.email?.split('@')[0] || 
                      'User',
            email_confirmed: session.user.confirmed_at !== null,
            created_at: session.user.created_at
          };
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      // Extract user data including full_name from metadata
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || 
                    session.user.user_metadata?.name || 
                    session.user.email?.split('@')[0] || 
                    'User',
          email_confirmed: session.user.confirmed_at !== null,
          created_at: session.user.created_at
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        const errorMessage = error.message?.toLowerCase() || '';
        const isVerificationError = errorMessage.includes('email not confirmed') ||
                                    errorMessage.includes('verify') ||
                                    errorMessage.includes('unverified') ||
                                    errorMessage.includes('confirm your email');
        
        const isInvalidCredentials = errorMessage.includes('invalid login credentials') ||
                                     errorMessage.includes('invalid credentials');
        
        if (isVerificationError) {
          return { 
            success: false, 
            message: 'Please verify your email before logging in. Check your inbox for the confirmation link.',
            needsVerification: true,
            email: email
          };
        }
        
        if (isInvalidCredentials) {
          return { 
            success: false, 
            message: 'Invalid email or password. Please check your credentials and try again.',
            needsVerification: false
          };
        }
        
        return { 
          success: false, 
          message: error.message || 'Login failed. Please try again.',
          needsVerification: false
        };
      }
      
      // Extract user data with full_name from metadata
      const userData = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || 
                  data.user.user_metadata?.name || 
                  data.user.email?.split('@')[0] || 
                  'User',
        email_confirmed: data.user.confirmed_at !== null,
        created_at: data.user.created_at
      };
      
      setUser(userData);
      setSession(data.session);
      toast.success(`Welcome back, ${userData.full_name}!`);
      return { success: true, user: userData };
    } catch (error) {
      const message = error.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      console.error('Login error:', error);
      return { success: false, message, needsVerification: false };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Attempting registration:', userData.email);
      console.log('Full name being sent:', userData.full_name); // Debug log
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,  // This is key!
            name: userData.full_name        // Also set as name for compatibility
          }
        }
      });
      
      if (error) {
        if (error.message?.toLowerCase().includes('already registered')) {
          toast.error('User already exists. Please login.');
          return { 
            success: false, 
            requires_confirmation: false, 
            message: 'User already exists. Please login instead.'
          };
        }
        throw error;
      }
      
      console.log('Supabase response:', data);
      
      if (data.user?.identities?.length === 0) {
        toast.info('User already exists. Please login or resend verification email.');
        return { 
          success: false, 
          requires_confirmation: true, 
          email: userData.email,
          message: 'User already exists. Please check your email for verification or login.'
        };
      }
      
      if (data.user?.confirmed_at) {
        toast.success('Registration successful! Please login.');
        return { 
          success: true, 
          requires_confirmation: false,
          message: 'Registration successful!'
        };
      } else {
        toast.success('Please check your email to verify your account!');
        return { 
          success: true, 
          requires_confirmation: true, 
          email: userData.email,
          message: 'Verification email sent. Please check your inbox.'
        };
      }
    } catch (error) {
      const message = error.message || 'Registration failed. Please try again.';
      toast.error(message);
      console.error('Registration error:', error);
      return { success: false, message, requires_confirmation: false };
    }
  };

  const resendVerification = async (email) => {
    try {
      console.log('Resending verification email to:', email);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });
      
      if (error) throw error;
      
      toast.success('Verification email resent! Please check your inbox.');
      return { success: true, message: 'Verification email sent' };
    } catch (error) {
      const message = error.message || 'Failed to resend verification email';
      toast.error(message);
      console.error('Resend verification error:', error);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  const updateUser = async (updates) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });
      
      if (error) throw error;
      
      const updatedUserData = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || 
                  data.user.user_metadata?.name || 
                  data.user.email?.split('@')[0] || 
                  'User',
        email_confirmed: data.user.confirmed_at !== null,
        created_at: data.user.created_at
      };
      
      setUser(updatedUserData);
      toast.success('Profile updated successfully');
      return { success: true, user: updatedUserData };
    } catch (error) {
      const message = error.message || 'Failed to update profile';
      toast.error(message);
      return { success: false, message };
    }
  };

  const getAccessToken = () => {
    return session?.access_token || null;
  };

  const getUserName = () => {
    return user?.full_name || user?.email?.split('@')[0] || 'User';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      loading, 
      login, 
      register, 
      logout,
      resendVerification,
      updateUser,
      getAccessToken,
      getUserName,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;