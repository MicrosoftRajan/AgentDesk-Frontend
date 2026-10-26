import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { auditClinic } from "./availability";
import {
  addScheduleException,
  assignDoctor,
  cancelAppointment,
  createAppointment,
  registerPatient,
  removeScheduleException,
  rescheduleAppointment,
  updateAppointmentStatus,
  updatePatient,
  type Actor,
  type CreateInput,
  type OpResult,
} from "./operations";
import { IDS, buildSeed } from "./seed";
import type {
  Appointment,
  AppointmentStatus,
  ClinicData,
  DemoRole,
  DemoSession,
  ExceptionKind,
  Patient,
  ScheduleException,
} from "./types";

const STORAGE_KEY = "agentdesk-demo-v1";

interface Toast {
  message: string;
  tone: "ok" | "err";
}

export interface PrototypeApi {
  data: ClinicData;
  session: DemoSession | null;
  focusLocationId: string;
  toast: Toast | null;
  setRole: (role: DemoRole) => void;
  setFocusLocationId: (locationId: string) => void;
  dismissToast: () => void;
  reset: () => void;
  registerPatient: (input: {
    fullName: string;
    phone: string;
    dateOfBirth: string | null;
  }) => OpResult<Patient>;
  updatePatient: (input: {
    patientId: string;
    fullName: string;
    phone: string;
    dateOfBirth: string | null;
  }) => OpResult<Patient>;
  createAppointment: (
    input: Omit<CreateInput, "actor">,
  ) => OpResult<Appointment>;
  assignDoctor: (appointmentId: string, doctorId: string) => OpResult<Appointment>;
  rescheduleAppointment: (
    appointmentId: string,
    date: string,
    startTime: string,
  ) => OpResult<Appointment>;
  cancelAppointment: (appointmentId: string, reason: string) => OpResult<Appointment>;
  updateAppointmentStatus: (
    appointmentId: string,
    status: AppointmentStatus,
    note: string | null,
  ) => OpResult<Appointment>;
  addScheduleException: (input: {
    doctorId: string;
    locationId: string;
    exceptionDate: string;
    kind: ExceptionKind;
    startTime: string | null;
    endTime: string | null;
    note: string;
  }) => OpResult<ScheduleException>;
  removeScheduleException: (exceptionId: string) => OpResult<null>;
}

const PrototypeContext = createContext<PrototypeApi | null>(null);

const ROLE_PROFILE: Record<DemoRole, string> = {
  patient: IDS.priyaProfile,
  staff: IDS.aisha,
  doctor: IDS.anika,
};

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ClinicData | null>(null);
  const [session, setSession] = useState<DemoSession | null>(null);
  const [focusLocationId, setFocusLocationId] = useState<string>(IDS.andheri);
  const [toast, setToast] = useState<Toast | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            version?: number;
            data?: ClinicData;
            session?: DemoSession | null;
            focusLocationId?: string;
          };
          if (parsed.version === 1 && parsed.data && auditClinic(parsed.data).length === 0) {
            if (!live) {
              return;
            }
            setData(parsed.data);
            setSession(parsed.session ?? null);
            setFocusLocationId(parsed.focusLocationId ?? IDS.andheri);
            return;
          }
        }
      } catch {
        // A fresh dataset is safer than a partial save.
      }
      if (live) {
        setData(buildSeed());
      }
    };
    load().finally(() => {
      if (live) {
        setReady(true);
      }
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !data) {
      return;
    }
    void AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, data, session, focusLocationId }),
    );
  }, [data, session, focusLocationId, ready]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(timer);
  }, [toast]);

  const commit = useCallback(<T,>(result: OpResult<T>): OpResult<T> => {
    setData(result.data);
    setToast({ message: result.message, tone: result.ok ? "ok" : "err" });
    return result;
  }, []);

  const api = useMemo<PrototypeApi | null>(() => {
    if (!data) {
      return null;
    }
    const actor: Actor | null = session
      ? { id: session.profileId, role: session.role }
      : null;
    const missing = <T,>(): OpResult<T> =>
      commit({ ok: false, message: "Choose a demo role first.", data });

    return {
      data,
      session,
      focusLocationId,
      toast,
      setRole: (role) => {
        setSession({ role, profileId: ROLE_PROFILE[role] });
        setFocusLocationId(IDS.andheri);
      },
      setFocusLocationId,
      dismissToast: () => setToast(null),
      reset: () => {
        setData(buildSeed());
        setToast({
          message: "Demo clinic restored to the original records.",
          tone: "ok",
        });
      },
      registerPatient: (input) => (actor ? commit(registerPatient(data, input)) : missing()),
      updatePatient: (input) =>
        actor ? commit(updatePatient(data, actor, input)) : missing(),
      createAppointment: (input) =>
        actor ? commit(createAppointment(data, { ...input, actor })) : missing(),
      assignDoctor: (appointmentId, doctorId) =>
        actor ? commit(assignDoctor(data, actor, appointmentId, doctorId)) : missing(),
      rescheduleAppointment: (appointmentId, date, startTime) =>
        actor
          ? commit(rescheduleAppointment(data, actor, appointmentId, date, startTime))
          : missing(),
      cancelAppointment: (appointmentId, reason) =>
        actor ? commit(cancelAppointment(data, actor, appointmentId, reason)) : missing(),
      updateAppointmentStatus: (appointmentId, status, note) =>
        actor
          ? commit(updateAppointmentStatus(data, actor, appointmentId, status, note))
          : missing(),
      addScheduleException: (input) =>
        actor ? commit(addScheduleException(data, actor, input)) : missing(),
      removeScheduleException: (exceptionId) =>
        actor ? commit(removeScheduleException(data, actor, exceptionId)) : missing(),
    };
  }, [commit, data, focusLocationId, session, toast]);

  if (!ready || !api) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color="#0F766E" />
        <Text style={styles.text}>Loading the HealthFirst prototype…</Text>
      </View>
    );
  }

  return <PrototypeContext.Provider value={api}>{children}</PrototypeContext.Provider>;
}

export function usePrototype(): PrototypeApi {
  const value = useContext(PrototypeContext);
  if (!value) {
    throw new Error("usePrototype must be used inside PrototypeProvider");
  }
  return value;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#F7F9FC",
  },
  text: {
    color: "#64748B",
    fontSize: 14,
  },
});
