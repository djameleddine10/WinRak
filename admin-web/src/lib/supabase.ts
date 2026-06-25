import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string
          role: 'passenger' | 'driver' | 'admin'
          avatar_url: string | null
          created_at: string
          wilaya: string | null
          wallet_balance: number
          is_blocked: boolean
        }
      }
      drivers: {
        Row: {
          id: string
          user_id: string
          status: 'active' | 'pending' | 'suspended'
          vehicle_make: string
          vehicle_model: string
          vehicle_year: number
          vehicle_plate: string
          vehicle_color: string
          rating: number
          total_rides: number
          total_earnings: number
          acceptance_rate: number
          created_at: string
          license_url: string | null
          insurance_url: string | null
        }
      }
      rides: {
        Row: {
          id: string
          passenger_id: string
          driver_id: string | null
          ride_type: 'passenger' | 'women' | 'delivery' | 'pharmacy' | 'food'
          status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
          pickup_address: string
          dropoff_address: string
          distance_km: number
          price: number
          duration_minutes: number | null
          created_at: string
          accepted_at: string | null
          picked_up_at: string | null
          completed_at: string | null
        }
      }
      driver_locations: {
        Row: {
          driver_id: string
          latitude: number
          longitude: number
          heading: number
          speed: number
          is_online: boolean
          updated_at: string
        }
      }
      restaurants: {
        Row: {
          id: string
          name: string
          name_fr: string | null
          category: string
          city: string
          address: string
          phone: string
          logo_url: string | null
          cover_url: string | null
          open_from: string
          open_to: string
          delivery_fee: number
          min_order: number
          status: 'active' | 'pending'
          rating: number
          created_at: string
        }
      }
      menu_items: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          description: string | null
          price: number
          category: string | null
          image_url: string | null
          is_available: boolean
          created_at: string
        }
      }
      pharmacies: {
        Row: {
          id: string
          name: string
          city: string
          address: string
          phone: string
          open_from: string
          open_to: string
          status: 'active' | 'pending'
          created_at: string
        }
      }
      medicines: {
        Row: {
          id: string
          pharmacy_id: string
          name: string
          description: string | null
          price: number
          category: string | null
          stock_available: boolean
          image_url: string | null
          created_at: string
        }
      }
      pricing_config: {
        Row: {
          id: string
          key: string
          value: string
          label: string
          category: string
          updated_at: string
        }
      }
      wallet_transactions: {
        Row: {
          id: string
          user_id: string
          type: string
          amount: number
          description: string
          created_at: string
        }
      }
    }
  }
}
