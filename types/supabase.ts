export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      registros: {
        Row: {
          id: string;
          folio: string;
          nombre: string;
          apellido: string;
          email: string;
          telefono: string | null;
          empresa: string;
          cargo: string;
          tipo_acceso: "estudiante" | "general" | "vip";
          monto_mxn: number;
          estado_pago: "pendiente" | "pagado" | "cancelado";
          credencial_estudiantil: boolean;
          notas_internas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          folio: string;
          nombre: string;
          apellido: string;
          email: string;
          telefono?: string | null;
          empresa: string;
          cargo: string;
          tipo_acceso: "estudiante" | "general" | "vip";
          monto_mxn: number;
          estado_pago?: "pendiente" | "pagado" | "cancelado";
          credencial_estudiantil?: boolean;
          notas_internas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          folio?: string;
          nombre?: string;
          apellido?: string;
          email?: string;
          telefono?: string | null;
          empresa?: string;
          cargo?: string;
          tipo_acceso?: "estudiante" | "general" | "vip";
          monto_mxn?: number;
          estado_pago?: "pendiente" | "pagado" | "cancelado";
          credencial_estudiantil?: boolean;
          notas_internas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
