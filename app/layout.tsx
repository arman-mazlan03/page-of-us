import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

export const metadata: Metadata = {
    title: "Page of Us",
    description: "A private collection of our cherished memories",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link href='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css' rel='stylesheet' />
            </head>
            <body className="antialiased">
                <AuthProvider>
                    <WorkspaceProvider>
                        {children}
                    </WorkspaceProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
