'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface BottleReply {
    id: string;
    text: string;
    author: string;
    createdAt: string;
}

interface Bottle {
    message: string;
    lat: number;
    lng: number;
    lastMovedAt: string;
    replies?: BottleReply[];
}

interface Workspace {
    id: string;
    name: string;
    allowedEmails: string[];
    bottle?: Bottle;
}

interface WorkspaceContextType {
    workspace: Workspace | null;
    isLoading: boolean;
    isAllowedUser: boolean;
    updateBottleMessage: (message: string) => Promise<void>;
    moveBottle: (lat: number, lng: number) => Promise<void>;
    replyToBottle: (text: string) => Promise<void>;
    deleteBottleReply: (replyId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAllowedUser, setIsAllowedUser] = useState(false);

    const workspaceId = process.env.NEXT_PUBLIC_WORKSPACE_ID || 'shared_workspace_main';

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
                const data = workspaceDoc.data();
                setWorkspace({
                    id: workspaceId,
                    name: data.name || 'Our Memories',
                    allowedEmails: data.allowedEmails || allowedEmails,
                    bottle: data.bottle
                });
            } else {
                // Create workspace if it doesn't exist
                const defaultBottle: Bottle = {
                    message: "Welcome to our secret bottle! Write something for us to find.",
                    lat: 5.3547,
                    lng: 100.3293,
                    lastMovedAt: new Date().toISOString()
                };

                const newWorkspace: Workspace = {
                    id: workspaceId,
                    name: 'Our Memories',
                    allowedEmails: allowedEmails,
                    bottle: defaultBottle
                };

                await setDoc(doc(db, 'workspaces', workspaceId), {
                    name: newWorkspace.name,
                    allowedEmails: allowedEmails,
                    bottle: defaultBottle,
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

    const updateBottleMessage = async (message: string) => {
        if (!workspace) return;
        try {
            console.log('UpdateBottleMessage: current workspace bottle', workspace.bottle);
            // If there's no existing bottle, provide default coordinates
            const bottleData = workspace.bottle || {
                lat: 5.3547, // Default Penang
                lng: 100.3293,
                lastMovedAt: new Date().toISOString()
            };

            const lat = Number(bottleData.lat);
            const lng = Number(bottleData.lng);

            const updatedBottle = {
                lat: isNaN(lat) ? 5.3547 : lat,
                lng: isNaN(lng) ? 100.3293 : lng,
                message,
                lastMovedAt: new Date().toISOString(),
                replies: [] // Clear replies when a new main message is set
            };

            console.log('UpdateBottleMessage: saving new bottle', updatedBottle);

            await setDoc(doc(db, 'workspaces', workspaceId), {
                bottle: updatedBottle
            }, { merge: true });

            setWorkspace(prev => prev ? {
                ...prev,
                bottle: updatedBottle
            } : null);
        } catch (error) {
            console.error('Error updating bottle message:', error);
        }
    };

    const moveBottle = async (lat: number, lng: number) => {
        if (!workspace) return;
        try {
            const updatedBottle = {
                ...workspace.bottle,
                lat: Number(lat),
                lng: Number(lng),
                lastMovedAt: new Date().toISOString()
            } as Bottle;

            console.log('MoveBottle: saving bottle at', updatedBottle.lat, updatedBottle.lng);

            await setDoc(doc(db, 'workspaces', workspaceId), {
                bottle: updatedBottle
            }, { merge: true });

            setWorkspace(prev => prev ? {
                ...prev,
                bottle: updatedBottle
            } : null);
        } catch (error) {
            console.error('Error moving bottle:', error);
        }
    };

    const replyToBottle = async (text: string) => {
        if (!workspace || !workspace.bottle || !user) return;
        try {
            const newReply: BottleReply = {
                id: Math.random().toString(36).substring(7),
                text,
                author: user.email || 'Anonymous',
                createdAt: new Date().toISOString()
            };

            const updatedReplies = [...(workspace.bottle.replies || []), newReply];
            const updatedBottle = { ...workspace.bottle, replies: updatedReplies };

            await setDoc(doc(db, 'workspaces', workspaceId), {
                bottle: updatedBottle
            }, { merge: true });

            setWorkspace(prev => prev ? {
                ...prev,
                bottle: updatedBottle
            } : null);
        } catch (error) {
            console.error('Error replying to bottle:', error);
        }
    };

    const deleteBottleReply = async (replyId: string) => {
        if (!workspace || !workspace.bottle) return;
        try {
            const updatedReplies = (workspace.bottle.replies || []).filter(r => r.id !== replyId);
            const updatedBottle = { ...workspace.bottle, replies: updatedReplies };

            await setDoc(doc(db, 'workspaces', workspaceId), {
                bottle: updatedBottle
            }, { merge: true });

            setWorkspace(prev => prev ? {
                ...prev,
                bottle: updatedBottle
            } : null);
        } catch (error) {
            console.error('Error deleting bottle reply:', error);
        }
    };

    return (
        <WorkspaceContext.Provider
            value={{
                workspace,
                isLoading,
                isAllowedUser,
                updateBottleMessage,
                moveBottle,
                replyToBottle,
                deleteBottleReply,
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
