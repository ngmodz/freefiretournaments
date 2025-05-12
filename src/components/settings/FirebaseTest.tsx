import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { verifyFirestoreConnection, isMock } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const FirebaseTest = () => {
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
    timestamp?: Date;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentUser, userProfile } = useAuth();

  const verifyConnection = async () => {
    setLoading(true);
    try {
      const result = await verifyFirestoreConnection();
      setTestResult({
        ...result,
        timestamp: new Date(),
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#1F2937] border-gaming-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle size={20} className="text-gaming-primary" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Authentication Status */}
          <Alert variant={currentUser ? "default" : "destructive"}>
            <Info className="h-4 w-4" />
            <AlertTitle>Authentication Status</AlertTitle>
            <AlertDescription>
              {currentUser ? (
                <>User authenticated as: {currentUser.email}</>
              ) : (
                <>Not authenticated. Please sign in.</>
              )}
            </AlertDescription>
          </Alert>
          
          {/* Profile Status */}
          <Alert variant={userProfile ? "default" : "destructive"}>
            <Info className="h-4 w-4" />
            <AlertTitle>User Profile Status</AlertTitle>
            <AlertDescription>
              {userProfile ? (
                <>Profile loaded for user: {userProfile.ign || userProfile.email}</>
              ) : (
                <>Profile not loaded. Updates will fail.</>
              )}
            </AlertDescription>
          </Alert>
          
          {/* Firebase Mode */}
          {isMock ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Mock Mode Active</AlertTitle>
              <AlertDescription>
                Your app is running in mock mode. Firebase operations are simulated and no real database connections are made.
                Profile updates will not be saved to Firestore.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-[#A0AEC0]">
                Verify your connection to Firebase/Firestore to ensure profile updates can be saved.
              </p>
              
              <Button 
                onClick={verifyConnection} 
                disabled={loading}
                className="bg-[#1E3A8A] hover:bg-[#2563EB] mt-4"
              >
                {loading ? 'Verifying...' : 'Verify Firestore Connection'}
              </Button>
              
              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"} className="mt-4">
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {testResult.success 
                      ? "Connection Successful" 
                      : "Connection Failed"
                    }
                  </AlertTitle>
                  <AlertDescription>
                    {testResult.success 
                      ? `Successfully verified Firestore connection at ${testResult.timestamp?.toLocaleTimeString()}`
                      : `Error: ${testResult.error} (${testResult.timestamp?.toLocaleTimeString()})`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FirebaseTest; 