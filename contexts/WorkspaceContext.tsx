'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface Workspace {
    id: string;
    name: string;
    allowedEmails: string[];
}

interface WorkspaceContextType {
    workspace: Workspace | null;
    isLoading: boolean;
    isAllowedUser: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAllowedUser, setIsAllowedUser] = useState(false);

    useEffect(() => {
        if (user) {
            initializeWorkspace();
        } else {
            setWorkspace(null);
            setIsAllowedUser(false);
            setIsLoading(false);
        }
    }, [user]);

    const initializeWorkspace = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            // Get allowed emails and workspace ID from environment
            const allowedEmailsStr = process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '';
            const allowedEmails = allowedEmailsStr.split(',').map(email => email.trim()).filter(Boolean);
            const workspaceId = process.env.NEXT_PUBLIC_WORKSPACE_ID || 'shared_workspace_main';

            // Check if user is allowed
            const userIsAllowed = allowedEmails.includes(user.email || '');
            setIsAllowedUser(userIsAllowed);

            if (!userIsAllowed) {
                console.warn('User not in allowed list:', user.email);
                setIsLoading(false);
                return;
            }

            // Check if workspace exists
            const workspaceDoc = await getDoc(doc(db, 'workspaces', workspaceId));

            if (workspaceDoc.exists()) {
                // Load existing workspace
                setWorkspace({
                    id: workspaceDoc.id,
                    name: workspaceDoc.data().name || 'Our Memories',
                    allowedEmails: allowedEmails
                });
            } else {
                // Create workspace if it doesn't exist
                const newWorkspace: Workspace = {
                    id: workspaceId,
                    name: 'Our Memories',
                    allowedEmails: allowedEmails
                };

                await setDoc(doc(db, 'workspaces', workspaceId), {
                    name: newWorkspace.name,
                    allowedEmails: allowedEmails,
                    createdAt: new Date().toISOString(),
                });

                setWorkspace(newWorkspace);
            }

            // Update user document with workspace ID
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                workspaceId: workspaceId,
                lastLogin: new Date().toISOString(),
            }, { merge: true });

        } catch (error) {
            console.error('Error initializing workspace:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <WorkspaceContext.Provider
            value={{
                workspace,
                isLoading,
                isAllowedUser,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}
