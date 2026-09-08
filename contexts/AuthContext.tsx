'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { AuthProfile, TeamRole } from '@/types/crm';
import { useRouter, usePathname } from 'next/navigation';

export interface SignUpResult {
  error?: string;
  message?: string;
  requiresEmailConfirmation?: boolean;
}

interface AuthContextType {
  profile: AuthProfile | null;
  loading: boolean;
  isOwner: boolean;
  isAuthenticated: boolean;
  loginWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithPassword: (
    email: string,
    password: string,
    name: string,
    organizationName: string
  ) => Promise<SignUpResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'aischoolapp_crm_auth_profile';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Helper to build AuthProfile from Supabase user and team_member record
  const buildProfile = (user: any, memberData?: any): AuthProfile => {
    const meta = user?.user_metadata || {};
    const role: TeamRole =
      (memberData?.role as TeamRole) ||
      (meta.role as TeamRole) ||
      'Sales Executive';

    let is_owner = false;
    if (memberData && typeof memberData.is_owner === 'boolean') {
      is_owner = memberData.is_owner;
    } else if (meta && typeof meta.is_owner === 'boolean') {
      is_owner = meta.is_owner;
    } else {
      is_owner = role === 'Admin' || role === 'Manager';
    }

    const name =
      memberData?.name ||
      meta.name ||
      (user?.email ? user.email.split('@')[0] : 'Team Member');

    // For an owner, owner_id defaults to their user.id; for invited staff, it comes from memberData.owner_id or meta.owner_id
    const owner_id = memberData?.owner_id || meta.owner_id || (is_owner ? user.id : user.id);
    const organization = memberData?.organization_name || meta.organization || '';

    return {
      id: user.id,
      name,
      email: user.email || memberData?.email || '',
      role,
      is_owner,
      owner_id,
      organization,
      team_member_id: memberData?.id,
    };
  };

  useEffect(() => {
    const client = getSupabaseClient();
    let authSubscription: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      if (client) {
        try {
          const {
            data: { session },
          } = await client.auth.getSession();

          if (session?.user) {
            let { data: memberData } = await client
              .from('team_members')
              .select('*')
              .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
              .maybeSingle();

            // Link user_id if member was created by owner prior to staff first sign-in
            if (memberData && !memberData.user_id) {
              await client
                .from('team_members')
                .update({ user_id: session.user.id })
                .eq('id', memberData.id);
              memberData = { ...memberData, user_id: session.user.id };
            }

            const userProfile = buildProfile(session.user, memberData);
            setProfile(userProfile);
            if (typeof window !== 'undefined') {
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
            }
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Supabase auth getSession error:', err);
        }
      }

      // Check cached profile if no active session
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          try {
            setProfile(JSON.parse(stored));
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen to real-time auth state changes in Supabase
    if (client) {
      const { data: listener } = client.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_OUT' || !session?.user) {
            setProfile(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem(AUTH_STORAGE_KEY);
            }
          } else if (
            event === 'SIGNED_IN' ||
            event === 'TOKEN_REFRESHED' ||
            event === 'USER_UPDATED'
          ) {
            try {
              let { data: memberData } = await client
                .from('team_members')
                .select('*')
                .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
                .maybeSingle();

              if (memberData && !memberData.user_id) {
                await client
                  .from('team_members')
                  .update({ user_id: session.user.id })
                  .eq('id', memberData.id);
                memberData = { ...memberData, user_id: session.user.id };
              }

              const userProfile = buildProfile(session.user, memberData);
              setProfile(userProfile);
              if (typeof window !== 'undefined') {
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
              }
            } catch (err) {
              console.error('Error fetching member profile on auth change:', err);
            }
          }
        }
      );
      authSubscription = listener.subscription;
    }

    return () => {
      authSubscription?.unsubscribe();
    };
  }, []);

  // Protect internal routes if user is not authenticated
  useEffect(() => {
    if (!loading && !profile && pathname !== '/login') {
      router.push('/login');
    }
  }, [loading, profile, pathname, router]);

  // Real Supabase Login
  const loginWithPassword = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const client = getSupabaseClient();

    if (!client) {
      return { error: 'Database backend connection is not configured.' };
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (!data.user) {
      return { error: 'Invalid email or password.' };
    }

    let memberData: any = null;
    try {
      const res = await client
        .from('team_members')
        .select('*')
        .or(`user_id.eq.${data.user.id},email.eq.${cleanEmail}`)
        .maybeSingle();

      memberData = res.data;

      // If no team_member record exists yet, auto-provision one
      if (!memberData) {
        const meta = data.user.user_metadata || {};
        const role = (meta.role as TeamRole) || 'Admin';
        const is_owner = Boolean(meta.is_owner ?? true);

        let insertRes = await client
          .from('team_members')
          .upsert(
            {
              user_id: data.user.id,
              owner_id: data.user.id,
              organization_name: meta.organization || 'My School CRM',
              name: meta.name || cleanEmail.split('@')[0],
              email: cleanEmail,
              role,
              is_owner,
              status: 'active',
            },
            { onConflict: 'email' }
          )
          .select()
          .single();

        if (insertRes.error && insertRes.error.code === '42703') {
          // Retry without owner_id and organization_name
          insertRes = await client
            .from('team_members')
            .upsert(
              {
                user_id: data.user.id,
                name: meta.name || cleanEmail.split('@')[0],
                email: cleanEmail,
                role,
                is_owner,
                status: 'active',
              },
              { onConflict: 'email' }
            )
            .select()
            .single();
        }

        memberData = insertRes.data;
      } else if (!memberData.user_id) {
        // Link user_id if not linked
        await client
          .from('team_members')
          .update({ user_id: data.user.id })
          .eq('id', memberData.id);
      }
    } catch (dbErr) {
      console.warn('Error linking team member record on login:', dbErr);
    }

    const userProfile = buildProfile(data.user, memberData);
    setProfile(userProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
    }
    return {};
  };

  // Real Supabase Sign Up (Owner Only Workspace Registration)
  const signUpWithPassword = async (
    email: string,
    password: string,
    name: string,
    organizationName: string
  ): Promise<SignUpResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanOrg = organizationName.trim() || 'My School CRM';
    const client = getSupabaseClient();

    if (!client) {
      return { error: 'Database backend connection is not configured.' };
    }

    // New signups from public page are ALWAYS Owner / Admin creating their isolated workspace
    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: cleanName,
          role: 'Admin',
          is_owner: true,
          organization: cleanOrg,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (!data.user) {
      return { error: 'Registration could not be completed. Please try again.' };
    }

    // Create the Owner's team_member record where owner_id = data.user.id
    let memberData: any = null;
    try {
      let upsertRes = await client
        .from('team_members')
        .upsert(
          {
            user_id: data.user.id,
            owner_id: data.user.id, // Scoped to this owner's independent workspace
            organization_name: cleanOrg,
            name: cleanName || cleanEmail.split('@')[0],
            email: cleanEmail,
            role: 'Admin',
            is_owner: true,
            status: 'active',
          },
          { onConflict: 'email' }
        )
        .select()
        .single();

      if (upsertRes.error && upsertRes.error.code === '42703') {
        // Retry without owner_id / organization_name if columns not in database yet
        upsertRes = await client
          .from('team_members')
          .upsert(
            {
              user_id: data.user.id,
              name: cleanName || cleanEmail.split('@')[0],
              email: cleanEmail,
              role: 'Admin',
              is_owner: true,
              status: 'active',
            },
            { onConflict: 'email' }
          )
          .select()
          .single();
      }

      memberData = upsertRes.data;
    } catch (dbErr) {
      console.warn('Could not upsert owner team member record on signup:', dbErr);
    }

    // If session is present (auto-confirm enabled), sign in immediately
    if (data.session) {
      const userProfile = buildProfile(data.user, memberData);
      setProfile(userProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
      }
      return {
        message: 'Workspace created and signed in successfully!',
      };
    }

    // If email confirmation is required
    return {
      requiresEmailConfirmation: true,
      message:
        'Workspace created successfully! Please check your email to confirm your account before signing in.',
    };
  };

  // Real Sign Out
  const logout = async () => {
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.auth.signOut();
      }
    } catch (err) {
      console.error('Error during Supabase signout:', err);
    } finally {
      setProfile(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      router.push('/login');
    }
  };

  const isOwner = Boolean(
    profile?.is_owner || profile?.role === 'Admin' || profile?.role === 'Manager'
  );

  return (
    <AuthContext.Provider
      value={{
        profile,
        loading,
        isOwner,
        isAuthenticated: Boolean(profile),
        loginWithPassword,
        signUpWithPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
