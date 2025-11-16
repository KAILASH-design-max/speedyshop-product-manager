
"use server";

import { addProduct, getUserProfile, updateUserProfile, getAllUsers, adminUpdateUser, receivePurchaseOrder, bulkDeleteProducts, bulkUpdateProducts } from "@/lib/firestore";
import type { Product, PurchaseOrder, UserProfile } from "@/lib/types";
import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/firebase-admin";


// SECURITY HELPER
/**
 * Retrieves the authenticated user's profile and checks their role.
 * Throws an error if the user is not authenticated or does not have the required role.
 * @param allowedRoles - An optional array of roles that are allowed to perform the action. If not provided, any authenticated user is allowed.
 * @returns The user's profile.
 */
async function getAuthenticatedUserProfile(allowedRoles?: UserProfile['role'][]): Promise<UserProfile> {
  const sessionCookie = (await cookies()).get("__session")?.value;

  if (!sessionCookie) {
    throw new Error("You must be logged in to perform this action.");
  }
  
  const decodedToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
  
  if (!decodedToken.uid) {
    throw new Error("You must be logged in to perform this action.");
  }

  const userProfile = await getUserProfile(decodedToken.uid);

  if (!userProfile) {
    throw new Error("User profile not found.");
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    throw new Error("You do not have permission to perform this action.");
  }

  return userProfile;
}


export async function bulkAddProducts(products: Omit<Product, "id" | "historicalData">[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await getAuthenticatedUserProfile(['admin', 'inventory-manager']); // Secure: Write access required
    const promises = products.map(product => addProduct(product));
    await Promise.all(promises);
    return { success: true, count: products.length };
  } catch (error: any) {
    console.error("Error in bulkAddProducts:", error);
    return { success: false, count: 0, error: error.message || "An unexpected error occurred during the bulk upload." };
  }
}

export async function updateUserProfileAction(
  userData: Pick<UserProfile, 'name' | 'phoneNumber' | 'jobTitle' | 'department'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUserProfile(); // Any authenticated user can update their own profile
    
    await updateUserProfile(user.uid, {
      name: userData.name,
      phoneNumber: userData.phoneNumber,
      jobTitle: userData.jobTitle,
      department: userData.department,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error in updateUserProfileAction:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function adminUpdateUserAction(
  targetUid: string,
  updates: Pick<UserProfile, 'role' | 'status'>
): Promise<{ success: boolean; error?: string }> {
  try {
    await getAuthenticatedUserProfile(['admin']); // Only admins can perform this
    
    await adminUpdateUser(targetUid, updates);

    return { success: true };
  } catch (error: any) {
    console.error("Error in adminUpdateUserAction:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function getAllUsersAction(): Promise<{ users?: UserProfile[]; error?: string }> {
  try {
    await getAuthenticatedUserProfile(['admin']); // Only admins can view all users
    const users = await getAllUsers();
    return { users };
  } catch (error: any) {
    console.error("Error in getAllUsersAction:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function receivePurchaseOrderAction(purchaseOrder: PurchaseOrder): Promise<{ success: boolean, error?: string }> {
    try {
        await getAuthenticatedUserProfile(['admin', 'inventory-manager']); // Secure: Write access required
        await receivePurchaseOrder(purchaseOrder);
        return { success: true };
    } catch (error: any) {
        console.error("Error receiving purchase order:", error);
        return { success: false, error: error.message || "Failed to process purchase order reception." };
    }
}

export async function bulkDeleteProductsAction(productIds: string[]): Promise<{ success: boolean, error?: string }> {
    try {
        await getAuthenticatedUserProfile(['admin', 'inventory-manager']);
        await bulkDeleteProducts(productIds);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function bulkUpdateProductsAction(
    productIds: string[],
    updateType: 'deal' | 'festival',
    targetId: string
): Promise<{ success: boolean, error?: string }> {
    try {
        await getAuthenticatedUserProfile(['admin', 'inventory-manager']);
        await bulkUpdateProducts(productIds, updateType, targetId);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
