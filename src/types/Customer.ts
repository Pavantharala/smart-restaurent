//
// SMART CAFE - CUSTOMER TYPES
//
// Contains customer information used throughout the application.
//

export interface Customer {
  // Unique customer ID.
  id: string;

  // Customer's display name.
  name: string;

  // Phone number used for order identification/contact.
  phone: string;

  // Optional email address.
  email?: string;

  // Optional profile image.
  avatar?: string;

  // Date/time when the customer account was created.
  createdAt: string;
}