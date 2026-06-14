export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      calendar_events: {
        Row: {
          color: string;
          completed: boolean;
          created_at: string;
          description: string | null;
          ends_at: string;
          event_type: string;
          id: string;
          starts_at: string;
          subject: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string;
          completed?: boolean;
          created_at?: string;
          description?: string | null;
          ends_at: string;
          event_type?: string;
          id?: string;
          starts_at: string;
          subject?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string;
          completed?: boolean;
          created_at?: string;
          description?: string | null;
          ends_at?: string;
          event_type?: string;
          id?: string;
          starts_at?: string;
          subject?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      community_comments: {
        Row: {
          author_avatar: string;
          author_name: string;
          content: string;
          created_at: string;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          author_avatar?: string;
          author_name?: string;
          content: string;
          created_at?: string;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          author_avatar?: string;
          author_name?: string;
          content?: string;
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      community_likes: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      community_posts: {
        Row: {
          attachment_name: string | null;
          attachment_type: string | null;
          attachment_url: string | null;
          author_avatar: string;
          author_name: string;
          category: string;
          content: string;
          created_at: string;
          id: string;
          subject: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attachment_name?: string | null;
          attachment_type?: string | null;
          attachment_url?: string | null;
          author_avatar?: string;
          author_name?: string;
          category?: string;
          content: string;
          created_at?: string;
          id?: string;
          subject?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attachment_name?: string | null;
          attachment_type?: string | null;
          attachment_url?: string | null;
          author_avatar?: string;
          author_name?: string;
          category?: string;
          content?: string;
          created_at?: string;
          id?: string;
          subject?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      content_favorites: {
        Row: {
          content_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          content_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          content_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      flashcard_decks: {
        Row: {
          created_at: string;
          emoji: string;
          id: string;
          is_default: boolean;
          subject: string;
          title: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          emoji?: string;
          id?: string;
          is_default?: boolean;
          subject: string;
          title: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          emoji?: string;
          id?: string;
          is_default?: boolean;
          subject?: string;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      flashcard_reviews: {
        Row: {
          flashcard_id: string;
          id: string;
          next_review_date: string;
          rating: string;
          review_count: number;
          reviewed_at: string;
          user_id: string;
        };
        Insert: {
          flashcard_id: string;
          id?: string;
          next_review_date: string;
          rating: string;
          review_count?: number;
          reviewed_at?: string;
          user_id: string;
        };
        Update: {
          flashcard_id?: string;
          id?: string;
          next_review_date?: string;
          rating?: string;
          review_count?: number;
          reviewed_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey";
            columns: ["flashcard_id"];
            isOneToOne: false;
            referencedRelation: "flashcards";
            referencedColumns: ["id"];
          },
        ];
      };
      flashcards: {
        Row: {
          back: string;
          created_at: string;
          deck_id: string;
          front: string;
          id: string;
        };
        Insert: {
          back: string;
          created_at?: string;
          deck_id: string;
          front: string;
          id?: string;
        };
        Update: {
          back?: string;
          created_at?: string;
          deck_id?: string;
          front?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "flashcard_decks";
            referencedColumns: ["id"];
          },
        ];
      };
      lofypay_transactions: {
        Row: {
          amount: number;
          created_at: string;
          external_reference: string;
          id: string;
          id_transaction: string;
          notification_url: string | null;
          paid_at: string | null;
          payment_code: string;
          payment_code_base64: string;
          plan_id: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          external_reference: string;
          id?: string;
          id_transaction: string;
          notification_url?: string | null;
          paid_at?: string | null;
          payment_code: string;
          payment_code_base64: string;
          plan_id: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          external_reference?: string;
          id?: string;
          id_transaction?: string;
          notification_url?: string | null;
          paid_at?: string | null;
          payment_code?: string;
          payment_code_base64?: string;
          plan_id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lofypay_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      premium_waitlist: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          source: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          source?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          source?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar: string;
          created_at: string;
          display_name: string;
          id: string;
          onboarded: boolean;
          study_styles: string[];
          target_score: number;
          updated_at: string;
          vestibular: string;
        };
        Insert: {
          avatar?: string;
          created_at?: string;
          display_name?: string;
          id: string;
          onboarded?: boolean;
          study_styles?: string[];
          target_score?: number;
          updated_at?: string;
          vestibular?: string;
        };
        Update: {
          avatar?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
          onboarded?: boolean;
          study_styles?: string[];
          target_score?: number;
          updated_at?: string;
          vestibular?: string;
        };
        Relationships: [];
      };
      quick_review_results: {
        Row: {
          completed_at: string;
          id: string;
          score: number;
          subject: string;
          time_seconds: number | null;
          total: number;
          user_id: string;
        };
        Insert: {
          completed_at?: string;
          id?: string;
          score: number;
          subject: string;
          time_seconds?: number | null;
          total?: number;
          user_id: string;
        };
        Update: {
          completed_at?: string;
          id?: string;
          score?: number;
          subject?: string;
          time_seconds?: number | null;
          total?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      repertoire_favorites: {
        Row: {
          created_at: string;
          repertoire_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          repertoire_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          repertoire_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      simulado_questions: {
        Row: {
          correct_answer: string;
          created_at: string;
          explanation: string;
          id: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          option_e: string;
          question_number: number;
          question_text: string;
          simulado_id: string;
          subject: string | null;
        };
        Insert: {
          correct_answer: string;
          created_at?: string;
          explanation: string;
          id?: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          option_e: string;
          question_number: number;
          question_text: string;
          simulado_id: string;
          subject?: string | null;
        };
        Update: {
          correct_answer?: string;
          created_at?: string;
          explanation?: string;
          id?: string;
          option_a?: string;
          option_b?: string;
          option_c?: string;
          option_d?: string;
          option_e?: string;
          question_number?: number;
          question_text?: string;
          simulado_id?: string;
          subject?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "simulado_questions_simulado_id_fkey";
            columns: ["simulado_id"];
            isOneToOne: false;
            referencedRelation: "simulados";
            referencedColumns: ["id"];
          },
        ];
      };
      simulado_results: {
        Row: {
          answers: Json;
          completed_at: string;
          id: string;
          percentage: number;
          score: number;
          simulado_id: string;
          time_spent_minutes: number | null;
          total_questions: number;
          user_id: string;
        };
        Insert: {
          answers?: Json;
          completed_at?: string;
          id?: string;
          percentage: number;
          score: number;
          simulado_id: string;
          time_spent_minutes?: number | null;
          total_questions: number;
          user_id: string;
        };
        Update: {
          answers?: Json;
          completed_at?: string;
          id?: string;
          percentage?: number;
          score?: number;
          simulado_id?: string;
          time_spent_minutes?: number | null;
          total_questions?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "simulado_results_simulado_id_fkey";
            columns: ["simulado_id"];
            isOneToOne: false;
            referencedRelation: "simulados";
            referencedColumns: ["id"];
          },
        ];
      };
      simulados: {
        Row: {
          created_at: string;
          difficulty: string;
          id: string;
          subject: string | null;
          time_limit_minutes: number;
          title: string;
          total_questions: number;
          vestibular: string;
        };
        Insert: {
          created_at?: string;
          difficulty?: string;
          id?: string;
          subject?: string | null;
          time_limit_minutes: number;
          title: string;
          total_questions: number;
          vestibular: string;
        };
        Update: {
          created_at?: string;
          difficulty?: string;
          id?: string;
          subject?: string | null;
          time_limit_minutes?: number;
          title?: string;
          total_questions?: number;
          vestibular?: string;
        };
        Relationships: [];
      };
      study_group_events: {
        Row: {
          created_at: string;
          description: string | null;
          ends_at: string;
          group_id: string;
          id: string;
          starts_at: string;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          ends_at: string;
          group_id: string;
          id?: string;
          starts_at: string;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          ends_at?: string;
          group_id?: string;
          id?: string;
          starts_at?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_group_events_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "study_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      study_group_materials: {
        Row: {
          author_name: string;
          created_at: string;
          description: string | null;
          file_name: string | null;
          file_type: string | null;
          file_url: string | null;
          group_id: string;
          id: string;
          title: string;
          user_id: string;
        };
        Insert: {
          author_name?: string;
          created_at?: string;
          description?: string | null;
          file_name?: string | null;
          file_type?: string | null;
          file_url?: string | null;
          group_id: string;
          id?: string;
          title: string;
          user_id: string;
        };
        Update: {
          author_name?: string;
          created_at?: string;
          description?: string | null;
          file_name?: string | null;
          file_type?: string | null;
          file_url?: string | null;
          group_id?: string;
          id?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_group_materials_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "study_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      study_group_invites: {
        Row: {
          created_at: string;
          group_id: string;
          invite_token: string;
        };
        Insert: {
          created_at?: string;
          group_id: string;
          invite_token?: string;
        };
        Update: {
          created_at?: string;
          group_id?: string;
          invite_token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_group_invites_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: true;
            referencedRelation: "study_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      study_group_members: {
        Row: {
          avatar: string;
          display_name: string;
          group_id: string;
          joined_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          avatar?: string;
          display_name?: string;
          group_id: string;
          joined_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          avatar?: string;
          display_name?: string;
          group_id?: string;
          joined_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "study_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      study_group_posts: {
        Row: {
          author_avatar: string;
          author_name: string;
          content: string;
          created_at: string;
          group_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          author_avatar?: string;
          author_name?: string;
          content: string;
          created_at?: string;
          group_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          author_avatar?: string;
          author_name?: string;
          content?: string;
          created_at?: string;
          group_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_group_posts_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "study_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      study_groups: {
        Row: {
          created_at: string;
          description: string | null;
          emoji: string;
          id: string;
          name: string;
          owner_id: string;
          subject: string | null;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          emoji?: string;
          id?: string;
          name: string;
          owner_id: string;
          subject?: string | null;
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          emoji?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          subject?: string | null;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [];
      };
      study_sessions: {
        Row: {
          created_at: string;
          duration_minutes: number;
          id: string;
          subject: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          duration_minutes: number;
          id?: string;
          subject: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          subject?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      topic_progress: {
        Row: {
          completed: boolean;
          completed_at: string | null;
          id: string;
          subject: string;
          topic_key: string;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          completed_at?: string | null;
          id?: string;
          subject: string;
          topic_key: string;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          id?: string;
          subject?: string;
          topic_key?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          plan_id: string;
          renewed_at: string | null;
          started_at: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          plan_id: string;
          renewed_at?: string | null;
          started_at: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          plan_id?: string;
          renewed_at?: string | null;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_study_group: {
        Args: {
          _description?: string | null;
          _emoji?: string;
          _name: string;
          _subject?: string | null;
          _visibility?: string;
        };
        Returns: string;
      };
      get_simulado_aggregate: {
        Args: { _simulado_id: string };
        Returns: {
          avg_percentage: number;
          avg_score: number;
          total_attempts: number;
        }[];
      };
      get_simulado_percentile: {
        Args: { _percentage: number; _simulado_id: string };
        Returns: number;
      };
      is_group_member: {
        Args: { _group_id: string; _user_id: string };
        Returns: boolean;
      };
      is_group_owner: {
        Args: { _group_id: string; _user_id: string };
        Returns: boolean;
      };
      get_study_group_invite_token: {
        Args: { _group_id: string };
        Returns: string;
      };
      join_public_study_group: {
        Args: { _group_id: string };
        Returns: string;
      };
      join_study_group_by_invite: {
        Args: { _invite_token: string };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
