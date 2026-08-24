export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          nombre: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          nombre: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      app_secrets: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          created_at: string
          detalles: Json | null
          evento: string
          folio: string | null
          id: string
          ip: string | null
          user_agent: string | null
          usuario_email: string | null
        }
        Insert: {
          created_at?: string
          detalles?: Json | null
          evento: string
          folio?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
          usuario_email?: string | null
        }
        Update: {
          created_at?: string
          detalles?: Json | null
          evento?: string
          folio?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
          usuario_email?: string | null
        }
        Relationships: []
      }
      email_events: {
        Row: {
          created_at: string
          email: string
          error: string | null
          folio: string | null
          id: string
          metadata: Json
          provider: string
          provider_message_id: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          email: string
          error?: string | null
          folio?: string | null
          id?: string
          metadata?: Json
          provider?: string
          provider_message_id?: string | null
          status: string
          type: string
        }
        Update: {
          created_at?: string
          email?: string
          error?: string | null
          folio?: string | null
          id?: string
          metadata?: Json
          provider?: string
          provider_message_id?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          company: string
          consent_version: string
          consented_at: string
          contact_name: string
          created_at: string
          email: string
          first_touch_at: string | null
          id: string
          interest: string | null
          internal_notes: string | null
          job_title: string | null
          kind: string
          landing_page: string | null
          language: string
          last_touch_at: string | null
          next_follow_up_at: string | null
          owner: string | null
          payload_hash: string
          phone: string
          referrer: string | null
          requested_seats: number | null
          retention_until: string
          status: string
          submission_id: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          company: string
          consent_version: string
          consented_at: string
          contact_name: string
          created_at?: string
          email: string
          first_touch_at?: string | null
          id?: string
          interest?: string | null
          internal_notes?: string | null
          job_title?: string | null
          kind: string
          landing_page?: string | null
          language: string
          last_touch_at?: string | null
          next_follow_up_at?: string | null
          owner?: string | null
          payload_hash: string
          phone: string
          referrer?: string | null
          requested_seats?: number | null
          retention_until: string
          status?: string
          submission_id: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          company?: string
          consent_version?: string
          consented_at?: string
          contact_name?: string
          created_at?: string
          email?: string
          first_touch_at?: string | null
          id?: string
          interest?: string | null
          internal_notes?: string | null
          job_title?: string | null
          kind?: string
          landing_page?: string | null
          language?: string
          last_touch_at?: string | null
          next_follow_up_at?: string | null
          owner?: string | null
          payload_hash?: string
          phone?: string
          referrer?: string | null
          requested_seats?: number | null
          retention_until?: string
          status?: string
          submission_id?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      inquiry_events: {
        Row: {
          actor: string
          created_at: string
          event_type: string
          from_value: string | null
          id: number
          inquiry_id: string
          metadata: Json
          to_value: string | null
        }
        Insert: {
          actor?: string
          created_at?: string
          event_type: string
          from_value?: string | null
          id?: never
          inquiry_id: string
          metadata?: Json
          to_value?: string | null
        }
        Update: {
          actor?: string
          created_at?: string
          event_type?: string
          from_value?: string | null
          id?: never
          inquiry_id?: string
          metadata?: Json
          to_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_events_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_notification_attempts: {
        Row: {
          attempt_number: number
          attempted_at: string
          duration_ms: number
          error_code: string | null
          id: number
          notification_id: string
          provider_message_id: string | null
          result: string
        }
        Insert: {
          attempt_number: number
          attempted_at?: string
          duration_ms: number
          error_code?: string | null
          id?: never
          notification_id: string
          provider_message_id?: string | null
          result: string
        }
        Update: {
          attempt_number?: number
          attempted_at?: string
          duration_ms?: number
          error_code?: string | null
          id?: never
          notification_id?: string
          provider_message_id?: string | null
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_notification_attempts_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "inquiry_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_notifications: {
        Row: {
          attempt_count: number
          channel: string
          created_at: string
          id: string
          inquiry_id: string
          last_error_at: string | null
          last_error_code: string | null
          next_attempt_at: string | null
          processing_started_at: string | null
          provider_message_id: string | null
          sent_at: string | null
          status: string
          template: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          channel?: string
          created_at?: string
          id?: string
          inquiry_id: string
          last_error_at?: string | null
          last_error_code?: string | null
          next_attempt_at?: string | null
          processing_started_at?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          template: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          channel?: string
          created_at?: string
          id?: string
          inquiry_id?: string
          last_error_at?: string | null
          last_error_code?: string | null
          next_attempt_at?: string | null
          processing_started_at?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_notifications_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      registros: {
        Row: {
          apellido: string
          cancelacion_nota: string | null
          cancelado_en: string | null
          cancelado_por: string | null
          cargo: string
          codigo_postal_fiscal: string | null
          conekta_charge_id: string | null
          conekta_checkout_url: string | null
          conekta_order_id: string | null
          conekta_payment_status: string | null
          created_at: string
          credencial_estudiantil: boolean
          email: string
          empresa: string
          estado_pago: string
          fbclid: string | null
          first_touch_timestamp: string | null
          folio: string
          gbraid: string | null
          gclid: string | null
          id: string
          idempotency_key: string | null
          ip_address: string | null
          ip_registro: string | null
          landing_page: string | null
          last_touch_timestamp: string | null
          li_fat_id: string | null
          metodo_pago: string | null
          monto_mxn: number
          msclkid: string | null
          nombre: string
          notas_internas: string | null
          oxxo_barcode_url: string | null
          oxxo_expires_at: string | null
          pagado_at: string | null
          pagado_en: string | null
          pagado_por: string | null
          pago_nota: string | null
          razon_social: string | null
          referer: string | null
          referrer: string | null
          requiere_cfdi: boolean
          rfc: string | null
          spei_clabe: string | null
          spei_reference: string | null
          telefono: string | null
          tipo_acceso: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          wbraid: string | null
        }
        Insert: {
          apellido: string
          cancelacion_nota?: string | null
          cancelado_en?: string | null
          cancelado_por?: string | null
          cargo: string
          codigo_postal_fiscal?: string | null
          conekta_charge_id?: string | null
          conekta_checkout_url?: string | null
          conekta_order_id?: string | null
          conekta_payment_status?: string | null
          created_at?: string
          credencial_estudiantil?: boolean
          email: string
          empresa: string
          estado_pago?: string
          fbclid?: string | null
          first_touch_timestamp?: string | null
          folio: string
          gbraid?: string | null
          gclid?: string | null
          id?: string
          idempotency_key?: string | null
          ip_address?: string | null
          ip_registro?: string | null
          landing_page?: string | null
          last_touch_timestamp?: string | null
          li_fat_id?: string | null
          metodo_pago?: string | null
          monto_mxn: number
          msclkid?: string | null
          nombre: string
          notas_internas?: string | null
          oxxo_barcode_url?: string | null
          oxxo_expires_at?: string | null
          pagado_at?: string | null
          pagado_en?: string | null
          pagado_por?: string | null
          pago_nota?: string | null
          razon_social?: string | null
          referer?: string | null
          referrer?: string | null
          requiere_cfdi?: boolean
          rfc?: string | null
          spei_clabe?: string | null
          spei_reference?: string | null
          telefono?: string | null
          tipo_acceso: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          wbraid?: string | null
        }
        Update: {
          apellido?: string
          cancelacion_nota?: string | null
          cancelado_en?: string | null
          cancelado_por?: string | null
          cargo?: string
          codigo_postal_fiscal?: string | null
          conekta_charge_id?: string | null
          conekta_checkout_url?: string | null
          conekta_order_id?: string | null
          conekta_payment_status?: string | null
          created_at?: string
          credencial_estudiantil?: boolean
          email?: string
          empresa?: string
          estado_pago?: string
          fbclid?: string | null
          first_touch_timestamp?: string | null
          folio?: string
          gbraid?: string | null
          gclid?: string | null
          id?: string
          idempotency_key?: string | null
          ip_address?: string | null
          ip_registro?: string | null
          landing_page?: string | null
          last_touch_timestamp?: string | null
          li_fat_id?: string | null
          metodo_pago?: string | null
          monto_mxn?: number
          msclkid?: string | null
          nombre?: string
          notas_internas?: string | null
          oxxo_barcode_url?: string | null
          oxxo_expires_at?: string | null
          pagado_at?: string | null
          pagado_en?: string | null
          pagado_por?: string | null
          pago_nota?: string | null
          razon_social?: string | null
          referer?: string | null
          referrer?: string | null
          requiere_cfdi?: boolean
          rfc?: string | null
          spei_clabe?: string | null
          spei_reference?: string | null
          telefono?: string | null
          tipo_acceso?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          wbraid?: string | null
        }
        Relationships: []
      }
      ticket_capacity: {
        Row: {
          hold_minutes: number
          scope: string
          total_seats: number
          updated_at: string
        }
        Insert: {
          hold_minutes?: number
          scope: string
          total_seats: number
          updated_at?: string
        }
        Update: {
          hold_minutes?: number
          scope?: string
          total_seats?: number
          updated_at?: string
        }
        Relationships: []
      }
      ticket_order_events: {
        Row: {
          created_at: string
          event_type: string
          id: number
          metadata: Json
          order_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: never
          metadata?: Json
          order_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: never
          metadata?: Json
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ticket_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_order_invoice_details: {
        Row: {
          billing_email: string | null
          cfdi_use: string
          created_at: string
          legal_name: string
          order_id: string
          person_type: string
          postal_code: string
          rfc: string
          tax_regime: string
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          cfdi_use: string
          created_at?: string
          legal_name: string
          order_id: string
          person_type: string
          postal_code: string
          rfc: string
          tax_regime: string
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          cfdi_use?: string
          created_at?: string
          legal_name?: string
          order_id?: string
          person_type?: string
          postal_code?: string
          rfc?: string
          tax_regime?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_order_invoice_details_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "ticket_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_order_notification_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          duration_ms: number
          error_code: string | null
          id: number
          notification_id: string
          provider_message_id: string | null
          result: string
        }
        Insert: {
          attempt_number: number
          created_at?: string
          duration_ms: number
          error_code?: string | null
          id?: never
          notification_id: string
          provider_message_id?: string | null
          result: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          duration_ms?: number
          error_code?: string | null
          id?: never
          notification_id?: string
          provider_message_id?: string | null
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_order_notification_attempts_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "ticket_order_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_order_notifications: {
        Row: {
          attempt_count: number
          channel: string
          created_at: string
          id: string
          last_error_at: string | null
          last_error_code: string | null
          next_attempt_at: string | null
          order_id: string
          processing_started_at: string | null
          provider_message_id: string | null
          sent_at: string | null
          status: string
          template: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          channel?: string
          created_at?: string
          id?: string
          last_error_at?: string | null
          last_error_code?: string | null
          next_attempt_at?: string | null
          order_id: string
          processing_started_at?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          template: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          channel?: string
          created_at?: string
          id?: string
          last_error_at?: string | null
          last_error_code?: string | null
          next_attempt_at?: string | null
          order_id?: string
          processing_started_at?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_order_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ticket_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_orders: {
        Row: {
          buyer_name: string
          cfdi_uuid: string | null
          company: string | null
          consent_version: string
          consented_at: string
          created_at: string
          currency: string
          email: string
          first_touch_at: string | null
          id: string
          internal_notes: string | null
          invoice_status: string
          invoiced_at: string | null
          landing_page: string | null
          language: string
          last_touch_at: string | null
          owner: string | null
          paid_at: string | null
          payload_hash: string
          phone: string
          provider: string
          provider_payment_id: string | null
          provider_preference_id: string | null
          provider_status: string | null
          provider_status_detail: string | null
          quantity: number
          referrer: string | null
          requires_invoice: boolean
          retention_until: string
          status: string
          submission_id: string
          subtotal_cents: number
          tax_cents: number
          tax_rate_basis_points: number
          tier: string
          total_cents: number | null
          unit_price_cents: number
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          buyer_name: string
          cfdi_uuid?: string | null
          company?: string | null
          consent_version: string
          consented_at: string
          created_at?: string
          currency?: string
          email: string
          first_touch_at?: string | null
          id?: string
          internal_notes?: string | null
          invoice_status?: string
          invoiced_at?: string | null
          landing_page?: string | null
          language: string
          last_touch_at?: string | null
          owner?: string | null
          paid_at?: string | null
          payload_hash: string
          phone: string
          provider?: string
          provider_payment_id?: string | null
          provider_preference_id?: string | null
          provider_status?: string | null
          provider_status_detail?: string | null
          quantity: number
          referrer?: string | null
          requires_invoice?: boolean
          retention_until: string
          status?: string
          submission_id: string
          subtotal_cents: number
          tax_cents: number
          tax_rate_basis_points?: number
          tier: string
          total_cents?: number | null
          unit_price_cents: number
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          buyer_name?: string
          cfdi_uuid?: string | null
          company?: string | null
          consent_version?: string
          consented_at?: string
          created_at?: string
          currency?: string
          email?: string
          first_touch_at?: string | null
          id?: string
          internal_notes?: string | null
          invoice_status?: string
          invoiced_at?: string | null
          landing_page?: string | null
          language?: string
          last_touch_at?: string | null
          owner?: string | null
          paid_at?: string | null
          payload_hash?: string
          phone?: string
          provider?: string
          provider_payment_id?: string | null
          provider_preference_id?: string | null
          provider_status?: string | null
          provider_status_detail?: string | null
          quantity?: number
          referrer?: string | null
          requires_invoice?: boolean
          retention_until?: string
          status?: string
          submission_id?: string
          subtotal_cents?: number
          tax_cents?: number
          tax_rate_basis_points?: number
          tier?: string
          total_cents?: number | null
          unit_price_cents?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_registros_view: {
        Row: {
          apellido: string | null
          cargo: string | null
          conekta_order_id: string | null
          conekta_payment_status: string | null
          created_at: string | null
          email: string | null
          empresa: string | null
          estado_pago: string | null
          folio: string | null
          id: string | null
          ip_address: string | null
          metodo_pago: string | null
          monto_mxn: number | null
          nombre: string | null
          pagado_at: string | null
          razon_social: string | null
          requiere_cfdi: boolean | null
          rfc: string | null
          spei_clabe: string | null
          spei_reference: string | null
          telefono: string | null
          tipo_acceso: string | null
        }
        Insert: {
          apellido?: string | null
          cargo?: string | null
          conekta_order_id?: string | null
          conekta_payment_status?: string | null
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          estado_pago?: string | null
          folio?: string | null
          id?: string | null
          ip_address?: string | null
          metodo_pago?: string | null
          monto_mxn?: number | null
          nombre?: string | null
          pagado_at?: string | null
          razon_social?: string | null
          requiere_cfdi?: boolean | null
          rfc?: string | null
          spei_clabe?: string | null
          spei_reference?: string | null
          telefono?: string | null
          tipo_acceso?: string | null
        }
        Update: {
          apellido?: string | null
          cargo?: string | null
          conekta_order_id?: string | null
          conekta_payment_status?: string | null
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          estado_pago?: string | null
          folio?: string | null
          id?: string | null
          ip_address?: string | null
          metodo_pago?: string | null
          monto_mxn?: number | null
          nombre?: string | null
          pagado_at?: string | null
          razon_social?: string | null
          requiere_cfdi?: boolean | null
          rfc?: string | null
          spei_clabe?: string | null
          spei_reference?: string | null
          telefono?: string | null
          tipo_acceso?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      attach_ticket_order_preference: {
        Args: { p_order_id: string; p_preference_id: string }
        Returns: {
          order_id: string
          preference_id: string
        }[]
      }
      claim_inquiry_notification: {
        Args: { p_notification_id: string }
        Returns: {
          attempt_number: number
          inquiry_id: string
          notification_id: string
          template: string
        }[]
      }
      claim_inquiry_notifications: {
        Args: { p_limit?: number }
        Returns: {
          attempt_number: number
          inquiry_id: string
          notification_id: string
          template: string
        }[]
      }
      claim_ticket_order_notification: {
        Args: { p_notification_id: string }
        Returns: {
          attempt_number: number
          notification_id: string
          order_id: string
          template: string
        }[]
      }
      claim_ticket_order_notifications: {
        Args: { p_limit?: number }
        Returns: {
          attempt_number: number
          notification_id: string
          order_id: string
          template: string
        }[]
      }
      committed_ticket_seats: {
        Args: { p_hold_minutes?: number; p_scope: string }
        Returns: number
      }
      complete_inquiry_notification: {
        Args: {
          p_attempt_number: number
          p_duration_ms: number
          p_error_code?: string
          p_next_attempt_at?: string
          p_notification_id: string
          p_provider_message_id?: string
          p_result: string
        }
        Returns: {
          attempt_count: number
          notification_id: string
          status: string
        }[]
      }
      complete_ticket_order_notification: {
        Args: {
          p_attempt_number: number
          p_duration_ms: number
          p_error_code?: string
          p_next_attempt_at?: string
          p_notification_id: string
          p_provider_message_id?: string
          p_result: string
        }
        Returns: {
          attempt_count: number
          notification_id: string
          status: string
        }[]
      }
      create_inquiry: {
        Args: {
          p_company: string
          p_consent_version: string
          p_consented_at: string
          p_contact_name: string
          p_email: string
          p_first_touch_at?: string
          p_interest?: string
          p_job_title?: string
          p_kind: string
          p_landing_page?: string
          p_language: string
          p_last_touch_at?: string
          p_payload_hash: string
          p_phone: string
          p_referrer?: string
          p_requested_seats?: number
          p_retention_until: string
          p_submission_id: string
          p_utm_campaign?: string
          p_utm_content?: string
          p_utm_medium?: string
          p_utm_source?: string
          p_utm_term?: string
        }
        Returns: {
          inquiry_id: string
          notification_id: string
          outcome: string
        }[]
      }
      create_ticket_order: {
        Args: {
          p_billing_email?: string
          p_buyer_name: string
          p_cfdi_use?: string
          p_company?: string
          p_consent_version: string
          p_consented_at: string
          p_email: string
          p_first_touch_at?: string
          p_landing_page?: string
          p_language: string
          p_last_touch_at?: string
          p_legal_name?: string
          p_payload_hash: string
          p_person_type?: string
          p_phone: string
          p_postal_code?: string
          p_quantity: number
          p_referrer?: string
          p_requires_invoice?: boolean
          p_retention_until: string
          p_rfc?: string
          p_submission_id: string
          p_subtotal_cents: number
          p_tax_cents: number
          p_tax_rate_basis_points: number
          p_tax_regime?: string
          p_tier: string
          p_unit_price_cents: number
          p_utm_campaign?: string
          p_utm_content?: string
          p_utm_medium?: string
          p_utm_source?: string
          p_utm_term?: string
        }
        Returns: {
          order_id: string
          outcome: string
          total_cents: number
        }[]
      }
      get_cupos_disponibles: { Args: never; Returns: number }
      is_safe_inquiry_event_metadata: {
        Args: { p_metadata: Json }
        Returns: boolean
      }
      is_safe_ticket_order_event_metadata: {
        Args: { p_metadata: Json }
        Returns: boolean
      }
      record_ticket_order_payment: {
        Args: {
          p_order_id: string
          p_paid_at?: string
          p_payment_id: string
          p_provider_status?: string
          p_provider_status_detail?: string
          p_status: string
        }
        Returns: {
          order_id: string
          order_status: string
          outcome: string
        }[]
      }
      remaining_ticket_seats: { Args: { p_scope: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

