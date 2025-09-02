"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/lib/types";
import { getUserProfile } from "@/lib/firestore";
import { Header } from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Barcode as BarcodeIcon, Mail, Phone, Briefcase, Building, UserCircle } from "lucide-react";
import { Button } from "./ui/button";
import { UserBarcodeDialog } from "./user-barcode-dialog";

export function UserProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);


  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch your profile.",
          });
        } finally {
          setLoading(false);
        }
      }
    }
    fetchProfile();
  }, [user, toast]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const ProfileInfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => {
    if (!value) return null;
    return (
      <div className="flex items-center text-sm">
        <Icon className="h-4 w-4 mr-3 text-muted-foreground" />
        <span className="font-medium text-muted-foreground mr-2">{label}:</span>
        <span className="text-foreground">{value}</span>
      </div>
    );
  };
  
  if (loading || !userProfile) {
    return (
       <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8 container mx-auto">
           <Skeleton className="h-32 w-full mb-8" />
           <Skeleton className="h-64 w-full" />
        </main>
      </div>
    )
  }

  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8 container mx-auto">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24 border-2 border-primary">
                  <AvatarImage src={userProfile.photoURL ?? undefined} alt={userProfile.name} />
                  <AvatarFallback className="text-3xl">{getInitials(userProfile.name)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle className="text-3xl">{userProfile.name}</CardTitle>
                  <p className="text-muted-foreground">{userProfile.jobTitle || 'User'}</p>
                   <div className="flex items-center pt-2">
                     <span className={`inline-block h-3 w-3 rounded-full mr-2 ${userProfile.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                    <span className="text-sm capitalize">{userProfile.status}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Contact Information</h3>
                    <ProfileInfoItem icon={Mail} label="Email" value={userProfile.email} />
                    <ProfileInfoItem icon={Phone} label="Phone" value={userProfile.phoneNumber} />
                  </div>
                  <div className="space-y-4">
                     <h3 className="font-semibold">Role & Department</h3>
                    <ProfileInfoItem icon={UserCircle} label="Role" value={userProfile.role} />
                    <ProfileInfoItem icon={Briefcase} label="Job Title" value={userProfile.jobTitle} />
                    <ProfileInfoItem icon={Building} label="Department" value={userProfile.department} />
                  </div>
              </div>
               <div className="mt-8 flex justify-center">
                <Button onClick={() => setIsBarcodeOpen(true)}>
                  <BarcodeIcon className="mr-2 h-4 w-4" />
                  Show My Barcode
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
       <UserBarcodeDialog
        userProfile={userProfile}
        open={isBarcodeOpen}
        onOpenChange={setIsBarcodeOpen}
      />
    </>
  );
}
