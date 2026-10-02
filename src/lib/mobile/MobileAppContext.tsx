"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PROJECT_ID,
  MOCK_NOTIFICATIONS,
  MOCK_USER,
  getProjectById,
} from "./mockData";
import {
  getAccessibleProjectsForRole,
  userHasMultiProjectAccess,
} from "./projectAccess";
import type { AuthAccount } from "./auth";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  ROLE_LABELS,
  filterNotificationsForRole,
} from "./notifications";
import type {
  MockNotification,
  MockProject,
  MockRole,
  NotificationFilterCategory,
  NotificationListStatus,
  NotificationModule,
  NotificationPreferences,
  NotificationReadFilter,
} from "./types";

type MobileUser = {
  firstName: string;
  lastName: string;
  initials: string;
  company: string;
  role: MockRole;
  roleLabel: string;
};

type AppliedFilters = {
  category: NotificationFilterCategory | "all";
};

type MobileAppContextValue = {
  user: MobileUser;
  setMockRole: (role: MockRole) => void;
  applyAuthAccount: (account: AuthAccount) => void;
  currentProject: MockProject;
  setCurrentProjectId: (id: string) => void;
  projectSelectorOpen: boolean;
  openProjectSelector: () => void;
  closeProjectSelector: () => void;
  notifications: MockNotification[];
  roleNotifications: MockNotification[];
  markNotificationRead: (id: string) => void;
  markNotificationUnread: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  notificationFilter: NotificationReadFilter;
  setNotificationFilter: (filter: NotificationReadFilter) => void;
  notificationSearch: string;
  setNotificationSearch: (value: string) => void;
  appliedFilters: AppliedFilters;
  draftFilters: AppliedFilters;
  setDraftCategory: (category: NotificationFilterCategory | "all") => void;
  openFilterSheet: () => void;
  closeFilterSheet: () => void;
  filterSheetOpen: boolean;
  applyFilters: () => void;
  clearFilters: () => void;
  activeFilterCount: number;
  preferences: NotificationPreferences;
  setPushEnabled: (enabled: boolean) => void;
  setSmsEnabled: (enabled: boolean) => void;
  togglePreferenceLabel: (module: NotificationModule, key: string) => void;
  listStatus: NotificationListStatus;
  setListStatus: (status: NotificationListStatus) => void;
  retryLoadNotifications: () => void;
  unreadCount: number;
  overflowMenuOpen: boolean;
  openOverflowMenu: () => void;
  closeOverflowMenu: () => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  accessibleProjects: MockProject[];
  hasMultiProjectAccess: boolean;
  notificationProjectFilterId: "all" | string;
  setNotificationProjectFilterId: (id: "all" | string) => void;
  notificationProjectSelectorOpen: boolean;
  openNotificationProjectSelector: () => void;
  closeNotificationProjectSelector: () => void;
  visibleNotificationIds: string[];
  setVisibleNotificationIds: (ids: string[]) => void;
  notificationSelectionMode: boolean;
  selectedNotificationIds: string[];
  enterNotificationSelectionMode: () => void;
  exitNotificationSelectionMode: () => void;
  toggleNotificationSelected: (id: string) => void;
  selectAllVisibleNotifications: () => void;
  deselectAllNotifications: () => void;
  markNotificationsReadByIds: (ids: string[]) => void;
  markAllVisibleNotificationsRead: () => void;
  deleteNotificationsByIds: (ids: string[]) => void;
  bulkDeleteConfirmOpen: boolean;
  openBulkDeleteConfirm: () => void;
  closeBulkDeleteConfirm: () => void;
  confirmBulkDelete: () => void;
};

const defaultFilters: AppliedFilters = { category: "all" };

const MobileAppContext = createContext<MobileAppContextValue | null>(null);

export function MobileAppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileUser>(MOCK_USER);
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT_ID);
  const [projectSelectorOpen, setProjectSelectorOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [notificationFilter, setNotificationFilter] =
    useState<NotificationReadFilter>("all");
  const [notificationSearch, setNotificationSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [listStatus, setListStatus] = useState<NotificationListStatus>("ready");
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [notificationProjectFilterId, setNotificationProjectFilterId] = useState<
    "all" | string
  >("all");
  const [notificationProjectSelectorOpen, setNotificationProjectSelectorOpen] =
    useState(false);
  const [visibleNotificationIds, setVisibleNotificationIds] = useState<string[]>([]);
  const [notificationSelectionMode, setNotificationSelectionMode] = useState(false);
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<string[]>([]);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  const currentProject = useMemo(() => {
    return getProjectById(projectId) ?? getProjectById(DEFAULT_PROJECT_ID)!;
  }, [projectId]);

  const setCurrentProjectId = useCallback((id: string) => {
    setProjectId(id);
    setProjectSelectorOpen(false);
  }, []);

  const setMockRole = useCallback((role: MockRole) => {
    setUser((prev) => ({
      ...prev,
      role,
      roleLabel: ROLE_LABELS[role],
    }));
    setNotificationProjectFilterId("all");
  }, []);

  const applyAuthAccount = useCallback((account: AuthAccount) => {
    setUser({
      firstName: account.firstName,
      lastName: account.lastName,
      initials: account.initials,
      company: account.company,
      role: account.role,
      roleLabel: ROLE_LABELS[account.role],
    });
    setNotificationProjectFilterId("all");
  }, []);

  const accessibleProjects = useMemo(
    () => getAccessibleProjectsForRole(user.role),
    [user.role],
  );

  const hasMultiProjectAccess = useMemo(
    () => userHasMultiProjectAccess(user.role),
    [user.role],
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markNotificationUnread = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setOverflowMenuOpen(false);
  }, []);

  const markNotificationsReadByIds = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setNotifications((prev) =>
      prev.map((n) => (idSet.has(n.id) ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllVisibleNotificationsRead = useCallback(() => {
    markNotificationsReadByIds(visibleNotificationIds);
    setOverflowMenuOpen(false);
  }, [markNotificationsReadByIds, visibleNotificationIds]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const deleteNotificationsByIds = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setNotifications((prev) => prev.filter((n) => !idSet.has(n.id)));
    setSelectedNotificationIds((prev) => prev.filter((id) => !idSet.has(id)));
  }, []);

  const exitNotificationSelectionMode = useCallback(() => {
    setNotificationSelectionMode(false);
    setSelectedNotificationIds([]);
    setBulkDeleteConfirmOpen(false);
  }, []);

  const enterNotificationSelectionMode = useCallback(() => {
    setNotificationSelectionMode(true);
    setSelectedNotificationIds([]);
    setBulkDeleteConfirmOpen(false);
    setOverflowMenuOpen(false);
  }, []);

  const toggleNotificationSelected = useCallback((id: string) => {
    setSelectedNotificationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const selectAllVisibleNotifications = useCallback(() => {
    setSelectedNotificationIds(visibleNotificationIds);
  }, [visibleNotificationIds]);

  const deselectAllNotifications = useCallback(() => {
    setSelectedNotificationIds([]);
  }, []);

  const openBulkDeleteConfirm = useCallback(() => {
    if (selectedNotificationIds.length === 0) return;
    setBulkDeleteConfirmOpen(true);
  }, [selectedNotificationIds.length]);

  const closeBulkDeleteConfirm = useCallback(() => {
    setBulkDeleteConfirmOpen(false);
  }, []);

  const confirmBulkDelete = useCallback(() => {
    deleteNotificationsByIds(selectedNotificationIds);
    setBulkDeleteConfirmOpen(false);
    exitNotificationSelectionMode();
  }, [deleteNotificationsByIds, selectedNotificationIds, exitNotificationSelectionMode]);

  const openFilterSheet = useCallback(() => {
    setDraftFilters(appliedFilters);
    setFilterSheetOpen(true);
  }, [appliedFilters]);

  const applyFilters = useCallback(() => {
    setAppliedFilters(draftFilters);
    setFilterSheetOpen(false);
  }, [draftFilters]);

  const clearFilters = useCallback(() => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setFilterSheetOpen(false);
  }, []);

  const activeFilterCount = useMemo(() => {
    return appliedFilters.category === "all" ? 0 : 1;
  }, [appliedFilters]);

  const roleNotifications = useMemo(() => {
    return filterNotificationsForRole(notifications, user.role);
  }, [notifications, user.role]);

  const unreadCount = useMemo(
    () => roleNotifications.filter((n) => !n.read).length,
    [roleNotifications],
  );

  const retryLoadNotifications = useCallback(() => {
    setListStatus("loading");
    window.setTimeout(() => setListStatus("ready"), 650);
  }, []);

  const setPushEnabled = useCallback((enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, pushEnabled: enabled }));
  }, []);

  const setSmsEnabled = useCallback((enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, smsEnabled: enabled }));
  }, []);

  const togglePreferenceLabel = useCallback((module: NotificationModule, key: string) => {
    setPreferences((prev) => {
      const current = prev.modules[module];
      return {
        ...prev,
        modules: {
          ...prev.modules,
          [module]: {
            ...current,
            labels: current.labels.map((label) =>
              label.key === key ? { ...label, enabled: !label.enabled } : label,
            ),
          },
        },
      };
    });
  }, []);

  const value = useMemo<MobileAppContextValue>(
    () => ({
      user,
      setMockRole,
      applyAuthAccount,
      currentProject,
      setCurrentProjectId,
      projectSelectorOpen,
      openProjectSelector: () => setProjectSelectorOpen(true),
      closeProjectSelector: () => setProjectSelectorOpen(false),
      notifications,
      roleNotifications,
      markNotificationRead,
      markNotificationUnread,
      markAllNotificationsRead,
      deleteNotification,
      notificationFilter,
      setNotificationFilter,
      notificationSearch,
      setNotificationSearch,
      appliedFilters,
      draftFilters,
      setDraftCategory: (category) => setDraftFilters({ category }),
      openFilterSheet,
      closeFilterSheet: () => setFilterSheetOpen(false),
      filterSheetOpen,
      applyFilters,
      clearFilters,
      activeFilterCount,
      preferences,
      setPushEnabled,
      setSmsEnabled,
      togglePreferenceLabel,
      listStatus,
      setListStatus,
      retryLoadNotifications,
      unreadCount,
      overflowMenuOpen,
      openOverflowMenu: () => setOverflowMenuOpen(true),
      closeOverflowMenu: () => setOverflowMenuOpen(false),
      isOffline,
      setIsOffline,
      accessibleProjects,
      hasMultiProjectAccess,
      notificationProjectFilterId,
      setNotificationProjectFilterId,
      notificationProjectSelectorOpen,
      openNotificationProjectSelector: () => setNotificationProjectSelectorOpen(true),
      closeNotificationProjectSelector: () => setNotificationProjectSelectorOpen(false),
      visibleNotificationIds,
      setVisibleNotificationIds,
      notificationSelectionMode,
      selectedNotificationIds,
      enterNotificationSelectionMode,
      exitNotificationSelectionMode,
      toggleNotificationSelected,
      selectAllVisibleNotifications,
      deselectAllNotifications,
      markNotificationsReadByIds,
      markAllVisibleNotificationsRead,
      deleteNotificationsByIds,
      bulkDeleteConfirmOpen,
      openBulkDeleteConfirm,
      closeBulkDeleteConfirm,
      confirmBulkDelete,
    }),
    [
      user,
      setMockRole,
      applyAuthAccount,
      currentProject,
      setCurrentProjectId,
      projectSelectorOpen,
      notifications,
      roleNotifications,
      markNotificationRead,
      markNotificationUnread,
      markAllNotificationsRead,
      deleteNotification,
      notificationFilter,
      notificationSearch,
      appliedFilters,
      draftFilters,
      openFilterSheet,
      filterSheetOpen,
      applyFilters,
      clearFilters,
      activeFilterCount,
      preferences,
      setPushEnabled,
      setSmsEnabled,
      togglePreferenceLabel,
      listStatus,
      retryLoadNotifications,
      unreadCount,
      overflowMenuOpen,
      isOffline,
      accessibleProjects,
      hasMultiProjectAccess,
      notificationProjectFilterId,
      notificationProjectSelectorOpen,
      visibleNotificationIds,
      notificationSelectionMode,
      selectedNotificationIds,
      enterNotificationSelectionMode,
      exitNotificationSelectionMode,
      toggleNotificationSelected,
      selectAllVisibleNotifications,
      deselectAllNotifications,
      markNotificationsReadByIds,
      markAllVisibleNotificationsRead,
      deleteNotificationsByIds,
      bulkDeleteConfirmOpen,
      openBulkDeleteConfirm,
      closeBulkDeleteConfirm,
      confirmBulkDelete,
    ],
  );

  return (
    <MobileAppContext.Provider value={value}>{children}</MobileAppContext.Provider>
  );
}

export function useMobileApp() {
  const ctx = useContext(MobileAppContext);
  if (!ctx) {
    throw new Error("useMobileApp must be used within MobileAppProvider");
  }
  return ctx;
}
