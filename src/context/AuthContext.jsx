
import React, { createContext, useState, useEffect, useContext } from 'react';
// import { supabase } from '@/lib/supabaseClient'; // Will be enabled after integration

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // MOCKUP: Simulating user login for development without Supabase
        // In a real scenario, this would check for an active Supabase session.
        const mockUser = JSON.parse(localStorage.getItem('mockUser'));
        if (mockUser) {
            setUser(mockUser);
        }
        setLoading(false);
        // END MOCKUP

        /*
        // REAL SUPABASE LOGIC (to be enabled later)
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
        */
    }, []);

    const value = {
        user,
        loading,
        login: async (email, password) => {
            setLoading(true);
            // MOCKUP: Simulating a successful login
            const mockUserData = {
                id: 'mock-user-id',
                email: email,
                role: email.includes('admin') ? 'admin' : 'user', // Simple role simulation
            };
            localStorage.setItem('mockUser', JSON.stringify(mockUserData));
            setUser(mockUserData);
            setLoading(false);
            return { user: mockUserData, error: null };
            // END MOCKUP

            /*
            // REAL SUPABASE LOGIC
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            setLoading(false);
            return { user: data.user, error };
            */
        },
        logout: async () => {
            setLoading(true);
            // MOCKUP: Simulating logout
            localStorage.removeItem('mockUser');
            setUser(null);
            setLoading(false);
            // END MOCKUP

            /*
            // REAL SUPABASE LOGIC
            await supabase.auth.signOut();
            setLoading(false);
            */
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};