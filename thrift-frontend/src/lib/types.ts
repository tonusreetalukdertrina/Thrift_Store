export interface User {
  user_id: string
  name: string
  email: string
  phone: string
  role: 'user' | 'admin'
  profile_photo_url: string | null
  is_blocked?: boolean
  created_at?: string
}

export interface Category {
  category_id: number
  category_name: string
  description: string | null
  is_active: boolean
}

export interface Listing {
  listing_id: string
  seller_id: string
  category_id: number
  title: string
  description: string
  price: string
  condition: 'New' | 'Like New' | 'Good' | 'Fair'
  images: string[]
  status: 'draft' | 'active' | 'interested' | 'sold' | 'archived'
  location: string | null
  expires_at: string | null
  interested_buyer_id: string | null
  created_at: string
  updated_at: string
  seller?: Pick<User, 'user_id' | 'name' | 'phone' | 'profile_photo_url'>
  category?: Pick<Category, 'category_id' | 'category_name'>
  seller_avg_rating?: number | null
  interested_buyer?: Pick<User, 'user_id' | 'name' | 'phone'> | null
}

export interface Review {
  review_id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  rating: number
  comment: string | null
  seller_response: string | null
  seller_responded_at: string | null
  is_removed: boolean
  created_at: string
  buyer?: Pick<User, 'user_id' | 'name' | 'profile_photo_url'>
}

export interface Payment {
  payment_id: string
  seller_id: string
  listing_id: string
  amount: string
  currency: string
  method: string | null
  status: 'pending' | 'paid' | 'failed'
  transaction_ref: string | null
  paid_at: string | null
  created_at: string
  listing?: Pick<Listing, 'listing_id' | 'title'>
}

export interface Notification {
  notification_id: string
  user_id: string
  type: string
  channel: string
  subject: string | null
  body: string
  status: 'unread' | 'read'
  sent_at: string | null
  created_at: string
}

export interface Report {
  report_id: string
  reporter_id: string
  target_type: 'listing' | 'review' | 'user'
  target_id: string
  reason: string
  status: 'pending' | 'resolved'
  admin_id: string | null
  admin_notes: string | null
  resolved_at: string | null
  created_at: string
  reporter?: Pick<User, 'user_id' | 'name'>
}

export interface PaginatedData<T> {
  current_page: number
  data: T[]
  first_page_url: string
  from: number
  last_page: number
  per_page: number
  total: number
}

export interface ApiResponse<T> {
  data: T
  meta: { message: string }
  errors: Record<string, string[]> | []
}
