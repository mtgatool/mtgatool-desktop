/* eslint-disable */
/**
 * Generated Supabase schema types (project: mtgatool). Regenerate after any
 * migration with the Supabase MCP `generate_typescript_types` or the CLI.
 * Do not edit by hand.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      arena_accounts: {
        Row: {
          arena_id: string;
          display_name: string | null;
          last_seen_at: string;
          linked_at: string;
          user_id: string;
        };
        Insert: {
          arena_id: string;
          display_name?: string | null;
          last_seen_at?: string;
          linked_at?: string;
          user_id?: string;
        };
        Update: {
          arena_id?: string;
          display_name?: string | null;
          last_seen_at?: string;
          linked_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      auth_recovery: {
        Row: {
          email: string;
          updated_at: string;
          user_id: string;
          verified_at: string | null;
        };
        Insert: {
          email: string;
          updated_at?: string;
          user_id: string;
          verified_at?: string | null;
        };
        Update: {
          email?: string;
          updated_at?: string;
          user_id?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      arena_collection: {
        Row: {
          arena_id: string;
          cards: Json;
          prev_cards: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          arena_id: string;
          cards?: Json;
          prev_cards?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          arena_id?: string;
          cards?: Json;
          prev_cards?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "arena_collection_user_id_arena_id_fkey";
            columns: ["user_id", "arena_id"];
            isOneToOne: true;
            referencedRelation: "arena_accounts";
            referencedColumns: ["user_id", "arena_id"];
          }
        ];
      };
      arena_inventory: {
        Row: {
          arena_id: string;
          data: Json;
          gems: number | null;
          gold: number | null;
          total_vault_progress: number | null;
          updated_at: string;
          user_id: string;
          wc_common: number | null;
          wc_mythic: number | null;
          wc_rare: number | null;
          wc_track_position: number | null;
          wc_uncommon: number | null;
        };
        Insert: {
          arena_id: string;
          data?: Json;
          gems?: number | null;
          gold?: number | null;
          total_vault_progress?: number | null;
          updated_at?: string;
          user_id?: string;
          wc_common?: number | null;
          wc_mythic?: number | null;
          wc_rare?: number | null;
          wc_track_position?: number | null;
          wc_uncommon?: number | null;
        };
        Update: {
          arena_id?: string;
          data?: Json;
          gems?: number | null;
          gold?: number | null;
          total_vault_progress?: number | null;
          updated_at?: string;
          user_id?: string;
          wc_common?: number | null;
          wc_mythic?: number | null;
          wc_rare?: number | null;
          wc_track_position?: number | null;
          wc_uncommon?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "arena_inventory_user_id_arena_id_fkey";
            columns: ["user_id", "arena_id"];
            isOneToOne: true;
            referencedRelation: "arena_accounts";
            referencedColumns: ["user_id", "arena_id"];
          }
        ];
      };
      arena_ranks: {
        Row: {
          arena_id: string;
          constructed: Json | null;
          limited: Json | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          arena_id: string;
          constructed?: Json | null;
          limited?: Json | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          arena_id?: string;
          constructed?: Json | null;
          limited?: Json | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "arena_ranks_user_id_arena_id_fkey";
            columns: ["user_id", "arena_id"];
            isOneToOne: true;
            referencedRelation: "arena_accounts";
            referencedColumns: ["user_id", "arena_id"];
          }
        ];
      };
      decks: {
        Row: {
          arena_id: string;
          deck: Json;
          deck_id: string;
          name: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          arena_id: string;
          deck: Json;
          deck_id: string;
          name?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          arena_id?: string;
          deck?: Json;
          deck_id?: string;
          name?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "decks_user_id_arena_id_fkey";
            columns: ["user_id", "arena_id"];
            isOneToOne: false;
            referencedRelation: "arena_accounts";
            referencedColumns: ["user_id", "arena_id"];
          }
        ];
      };
      matches: {
        Row: {
          arena_id: string;
          created_at: string;
          duration: number | null;
          event_id: string | null;
          internal_match: Json;
          match_id: string;
          opp_deck_colors: number | null;
          played_at: string | null;
          player_deck_colors: number | null;
          player_deck_hash: string | null;
          player_deck_id: string | null;
          player_losses: number | null;
          player_name: string | null;
          player_wins: number | null;
          user_id: string;
        };
        Insert: {
          arena_id: string;
          created_at?: string;
          duration?: number | null;
          event_id?: string | null;
          internal_match: Json;
          match_id: string;
          opp_deck_colors?: number | null;
          played_at?: string | null;
          player_deck_colors?: number | null;
          player_deck_hash?: string | null;
          player_deck_id?: string | null;
          player_losses?: number | null;
          player_name?: string | null;
          player_wins?: number | null;
          user_id?: string;
        };
        Update: {
          arena_id?: string;
          created_at?: string;
          duration?: number | null;
          event_id?: string | null;
          internal_match?: Json;
          match_id?: string;
          opp_deck_colors?: number | null;
          played_at?: string | null;
          player_deck_colors?: number | null;
          player_deck_hash?: string | null;
          player_deck_id?: string | null;
          player_losses?: number | null;
          player_name?: string | null;
          player_wins?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_user_id_arena_id_fkey";
            columns: ["user_id", "arena_id"];
            isOneToOne: false;
            referencedRelation: "arena_accounts";
            referencedColumns: ["user_id", "arena_id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          background: Json | null;
          created_at: string;
          id: string;
          is_private: boolean;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          background?: Json | null;
          created_at?: string;
          id: string;
          is_private?: boolean;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          background?: Json | null;
          created_at?: string;
          id?: string;
          is_private?: boolean;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_latest_ranks: {
        Args: { p_limit?: number };
        Returns: {
          arena_id: string;
          display_name: string | null;
          username: string | null;
          avatar_url: string | null;
          constructed: Json | null;
          limited: Json | null;
          updated_at: string;
        }[];
      };
      get_public_profiles: {
        Args: { p_arena_ids: string[] };
        Returns: {
          arena_id: string;
          display_name: string | null;
          username: string | null;
          avatar_url: string | null;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
