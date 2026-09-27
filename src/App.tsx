import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider, useNetwork } from './context/NetworkContext';
import { Task, TaskStatus, Priority, UserNotification, FieldObservation, ObservationType } from './types';
import {
  subscribeToTasks,
  createTask,
  updateTask,
  deleteTask,
  batchUpdateTaskOrders,
} from './firebase/services';
import { Header, ActiveAppView } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { KanbanBoard } from './components/KanbanBoard';
import { ListView } from './components/ListView';
import { TaskModal } from './components/TaskModal';
import { AuthModal } from './components/AuthModal';
import { NotificationPopover } from './components/NotificationPopover';
import { MultimodalIngestModal } from './components/MultimodalIngestModal';
import { SiteMapView } from './components/SiteMapView';
import { DailyReportView } from './components/DailyReportView';
import { MultimodalHubView } from './components/MultimodalHubView';
import { ExecutiveDashboardView } from './components/ExecutiveDashboardView';
import { Infra4EngineView } from './components/Infra4EngineView';
import { MobileFieldView } from './components/MobileFieldView';
import { exportTasksToCsv } from './utils/csvExport';
import { exportToICalendar } from './utils/calendar';
import { scanTasksForDeadlines, sendPushNotification } from './utils/notifications';
import { INITIAL_OBSERVATIONS } from './data/sampleCivilData';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

function TaskManagementApp() {
  const { user, loading: authLoading, signInAsGuest } = useAuth();
  const { isOnline, setFirestoreMetadata, isUsingCache } = useNetwork();

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme_mode');
      if (saved) return saved === 'dark';
      return false; // Clean, minimalist light theme by default
    }
    return false;
  });

  // Apply dark mode class to root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme_mode', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Active Main App View: 'executive_evm' | 'infra4_engines' | 'mobile_field' | 'map' | 'ingest' | 'report' | 'tasks'
  const [activeView, setActiveView] = useState<ActiveAppView>('executive_evm');

  // Multimodal Field Observations (Photos, Audio memos, PDFs, Notes)
  const [observations, setObservations] = useState<FieldObservation[]>(() => {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('site_observations');
      if (local) {
        try {
          return JSON.parse(local);
        } catch (e) {
          console.warn('Failed parsing local observations:', e);
        }
      }
    }
    return INITIAL_OBSERVATIONS;
  });

  useEffect(() => {
    localStorage.setItem('site_observations', JSON.stringify(observations));
  }, [observations]);

  // Multimodal Ingestion Modal State
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestTab, setIngestTab] = useState<ObservationType>('photo');
  const [ingestZoneId, setIngestZoneId] = useState<string | undefined>(undefined);
  const [ingestCoords, setIngestCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [autoStartCamera, setAutoStartCamera] = useState(false);
  const [autoStartRecording, setAutoStartRecording] = useState(false);
  const [siteUpdateToast, setSiteUpdateToast] = useState<{
    id: string;
    title: string;
    type: ObservationType;
    message: string;
  } | null>(null);

  // Task State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Modals and Popovers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<TaskStatus>('todo');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Filters & Views for Tasks
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [disciplineFilter, setDisciplineFilter] = useState('all');
  const [taskViewMode, setTaskViewMode] = useState<'kanban' | 'list'>('kanban');

  // Sorting for List View
  const [sortField, setSortField] = useState<'dueDate' | 'priority' | 'progress' | 'title'>('dueDate');
  const [sortAsc, setSortAsc] = useState(true);

  // Notifications State
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  // 1. Subscribe to real-time Firestore database when user is authenticated
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    const unsubscribe = subscribeToTasks(
      user.uid,
      (fetchedTasks, metadata) => {
        setTasks(fetchedTasks);
        setIsSyncing(false);
        if (metadata) {
          setFirestoreMetadata(metadata);
        }
      },
      (err) => {
        console.error('Real-time database sync error:', err);
        // Only show fatal error banners if not expected offline/network transition
        const errMsg = err.message || '';
        if (!errMsg.includes('offline') && !errMsg.includes('unavailable') && !errMsg.includes('client is offline')) {
          setSyncError(errMsg || 'Database synchronization error');
        }
        setIsSyncing(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 2. Scan tasks for upcoming deadlines and dispatch notifications
  useEffect(() => {
    if (tasks.length === 0) return;
    const deadlineAlerts = scanTasksForDeadlines(tasks);
    setNotifications(deadlineAlerts);

    const todayAlerts = deadlineAlerts.filter((n) => n.type === 'due_soon' || n.type === 'overdue');
    if (todayAlerts.length > 0 && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const topAlert = todayAlerts[0];
      const sentSessionKey = `notif_sent_${topAlert.id}`;
      if (!sessionStorage.getItem(sentSessionKey)) {
        sendPushNotification(topAlert.taskTitle, {
          body: topAlert.message,
        });
        sessionStorage.setItem(sentSessionKey, 'true');
      }
    }
  }, [tasks]);

  // Extract unique disciplines
  const disciplines = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.discipline) set.add(t.discipline);
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Priority weights for sorting
  const priorityWeights: Record<Priority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (search) {
          const q = search.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = t.description?.toLowerCase().includes(q);
          const matchWbs = t.wbsCode?.toLowerCase().includes(q);
          const matchDiscipline = t.discipline?.toLowerCase().includes(q);
          const matchTags = t.tags?.some((tag) => tag.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchWbs && !matchDiscipline && !matchTags) {
            return false;
          }
        }
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
          return false;
        }
        if (disciplineFilter !== 'all' && t.discipline !== disciplineFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (taskViewMode === 'list') {
          let compare = 0;
          if (sortField === 'title') {
            compare = a.title.localeCompare(b.title);
          } else if (sortField === 'priority') {
            compare = (priorityWeights[a.priority] || 0) - (priorityWeights[b.priority] || 0);
          } else if (sortField === 'progress') {
            compare = (a.progress || 0) - (b.progress || 0);
          } else if (sortField === 'dueDate') {
            compare = (a.dueDate || '').localeCompare(b.dueDate || '');
          }
          return sortAsc ? compare : -compare;
        }
        return a.order - b.order;
      });
  }, [tasks, search, priorityFilter, disciplineFilter, taskViewMode, sortField, sortAsc]);

  // Handlers for task mutations
  const handleCreateOrUpdateTask = async (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...t, ...taskData, updatedAt: Date.now() } : t))
      );
      await updateTask(editingTask.id, taskData);
    } else {
      const newOrder = tasks.filter((t) => t.status === taskData.status).length;
      await createTask({
        ...taskData,
        userId: user.uid,
        order: newOrder,
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await deleteTask(taskId);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, updatedAt: Date.now() } : t))
    );
    await updateTask(taskId, { status: newStatus });
  };

  const handleReorderTasks = async (
    reorderedTasks: { id: string; order: number; status?: TaskStatus }[]
  ) => {
    setTasks((prev) => {
      const copy = [...prev];
      reorderedTasks.forEach((u) => {
        const item = copy.find((t) => t.id === u.id);
        if (item) {
          item.order = u.order;
          if (u.status) item.status = u.status;
        }
      });
      return copy.sort((a, b) => a.order - b.order);
    });

    try {
      await batchUpdateTaskOrders(reorderedTasks);
    } catch (err) {
      console.error('Failed to commit reorder to Firestore:', err);
    }
  };

  const handleOpenCreateModal = (defaultStatus: TaskStatus = 'todo') => {
    setEditingTask(null);
    setCreateDefaultStatus(defaultStatus);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSort = (field: 'dueDate' | 'priority' | 'progress' | 'title') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // CSV and Calendar Export
  const handleExportCsv = useCallback(() => {
    exportTasksToCsv(filteredTasks, `task-report-${new Date().toISOString().slice(0, 10)}.csv`);
  }, [filteredTasks]);

  const handleExportCalendar = useCallback(() => {
    exportToICalendar(filteredTasks, `task-deadlines-${new Date().toISOString().slice(0, 10)}.ics`);
  }, [filteredTasks]);

  // Handle adding new observation from MultimodalIngestModal
  const handleSaveObservation = (newObs: FieldObservation) => {
    setObservations((prev) => [newObs, ...prev]);

    // Format human-readable modality badge
    const modalityName =
      newObs.type === 'photo'
        ? 'Photo / Webcam Capture'
        : newObs.type === 'audio'
        ? 'Voice Recording Memo'
        : newObs.type === 'pdf'
        ? 'PDF Site Document'
        : 'Field Note';

    // Show persistent visual toast on the site
    setSiteUpdateToast({
      id: newObs.id,
      title: newObs.title,
      type: newObs.type,
      message: `${modalityName} ingested successfully! Site telemetry, CAD map & DSR log updated.`,
    });
    setTimeout(() => {
      setSiteUpdateToast((prev) => (prev?.id === newObs.id ? null : prev));
    }, 6000);

    // Create an alert notification if it is a critical hazard
    if (newObs.aiAnalysis?.severity === 'critical') {
      const hazardNotif: UserNotification = {
        id: `notif-${Date.now()}`,
        taskId: newObs.id,
        taskTitle: newObs.title,
        dueDate: new Date().toISOString().split('T')[0],
        type: 'due_soon',
        message: `CRITICAL SAFETY ALERT: ${newObs.aiAnalysis?.recommendedAction || newObs.description}`,
        timestamp: Date.now(),
        priority: 'critical',
        read: false,
      };
      setNotifications((prev) => [hazardNotif, ...prev]);
    }
  };

  // Dedicated opener with mode, autoStart parameters
  const handleOpenIngestModal = (
    tab: ObservationType = 'photo',
    zoneId?: string,
    coords?: { lat: number; lng: number },
    startCam: boolean = false,
    startRec: boolean = false
  ) => {
    setIngestTab(tab);
    setIngestZoneId(zoneId);
    setIngestCoords(coords);
    setAutoStartCamera(startCam);
    setAutoStartRecording(startRec);
    setIsIngestModalOpen(true);
  };

  // Handle map click to add observation at specific coordinates
  const handleAddObservationAtLocation = (
    coords: { lat: number; lng: number },
    zoneId: string
  ) => {
    handleOpenIngestModal('photo', zoneId, coords, false, false);
  };

  // Create WBS task directly from observation
  const handleCreateTaskFromObservation = (obs: FieldObservation) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const taskDraft: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: `Field Follow-up: ${obs.title}`,
      description: `${obs.description}\n\n[Location: ${obs.zone} | Grid ${obs.location.gridRef}]\n[AI Action: ${obs.aiAnalysis?.recommendedAction || 'Inspect and verify'}]`,
      priority: obs.aiAnalysis?.severity === 'critical' ? 'critical' : 'high',
      status: 'todo',
      dueDate: tomorrow.toISOString().split('T')[0],
      progress: 0,
      discipline: 'Civil',
      wbsCode: obs.wbsCode || '01-GEN-010',
      tags: ['field-inspection', obs.location.zoneId, obs.type],
      userId: user ? user.uid : 'guest-local',
      order: tasks.length,
    };

    if (user) {
      createTask(taskDraft);
    } else {
      setEditingTask({
        id: `draft-${Date.now()}`,
        ...taskDraft,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setIsTaskModalOpen(true);
    }
  };

  // Delete observation
  const handleDeleteObservation = (id: string) => {
    if (!window.confirm('Delete this observation record?')) return;
    setObservations((prev) => prev.filter((o) => o.id !== id));
  };

  // Calculate high level metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const criticalTasks = tasks.filter((t) => t.priority === 'critical' && t.status !== 'done').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B0F19] dark:text-slate-100 transition-colors flex flex-col font-sans selection:bg-slate-200 dark:selection:bg-slate-800">
      {/* High-Precision Header with Step 1-2-3 Navigation */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        notifications={notifications}
        isNotificationsOpen={isNotificationsOpen}
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenCreateTask={() => handleOpenCreateModal('todo')}
        onOpenIngestModal={() => {
          setIngestCoords(undefined);
          setIngestZoneId(undefined);
          setIsIngestModalOpen(true);
        }}
        onExportCsv={handleExportCsv}
        onExportCalendar={handleExportCalendar}
        isSyncing={isSyncing}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Notifications Popover Dropdown */}
      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <NotificationPopover
          notifications={notifications}
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onSelectTask={(taskId) => {
            const task = tasks.find((t) => t.id === taskId);
            if (task) handleOpenEditModal(task);
          }}
          onMarkAllRead={() => setNotifications([])}
        />
      </div>

      {/* Main Content Stage */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Error banner if sync issues occur */}
        {syncError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{syncError}</span>
            </div>
            <button
              onClick={() => setSyncError(null)}
              className="text-xs font-semibold underline hover:no-underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Offline-First Cache Assurance Banner */}
        {!isOnline && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span>
                <strong>Offline-First Active:</strong> Operating from local cache. You can continue updating tasks, logging site photos, and tracking WBS activities without interruption.
              </span>
            </div>
          </div>
        )}

        {/* EXECUTIVE EVM DASHBOARD (IMAGE 5) */}
        {activeView === 'executive_evm' && (
          <ExecutiveDashboardView
            onNavigateToEngines={() => setActiveView('infra4_engines')}
            onNavigateToMobile={() => setActiveView('mobile_field')}
          />
        )}

        {/* INFRA 4.0 4-ENGINE ARCHITECTURE (IMAGES 1, 2, 3) */}
        {activeView === 'infra4_engines' && (
          <Infra4EngineView
            onOpenIngestModal={() => handleOpenIngestModal('photo')}
            onOpenCamModal={() => handleOpenIngestModal('photo', undefined, undefined, true, false)}
            onSelectWbsTask={(code) => {
              setActiveView('tasks');
              setSearch(code);
            }}
          />
        )}

        {/* SITE ENGINEER MOBILE APP (IMAGE 4) */}
        {activeView === 'mobile_field' && (
          <MobileFieldView
            onOpenIngestModal={() => handleOpenIngestModal('photo')}
            onOpenCamModal={() => handleOpenIngestModal('photo', undefined, undefined, true, false)}
            onOpenAudioModal={() => handleOpenIngestModal('audio', undefined, undefined, false, true)}
            onOpenPdfModal={() => handleOpenIngestModal('pdf', undefined, undefined, false, false)}
          />
        )}

        {/* STEP 2: GEOSPATIAL CAD & SATELLITE SITE MAP */}
        {activeView === 'map' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/80 dark:border-slate-700">
                  Step 2: Geospatial CAD & Mapping
                </span>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                  Active Site Georeference & Telemetry Canvas
                </h1>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Click anywhere on map grid to pin observations • {observations.length} Geotagged records
              </div>
            </div>

            <SiteMapView
              observations={observations}
              onSelectObservation={(obs) => console.log('Selected:', obs.id)}
              onAddObservationAtLocation={handleAddObservationAtLocation}
              onCreateTaskFromObservation={handleCreateTaskFromObservation}
            />
          </div>
        )}

        {/* STEP 1: MULTIMODAL INGESTION HUB */}
        {activeView === 'ingest' && (
          <MultimodalHubView
            observations={observations}
            onOpenIngestModal={() => handleOpenIngestModal('photo')}
            onOpenCamModal={() => handleOpenIngestModal('photo', undefined, undefined, true, false)}
            onOpenAudioModal={() => handleOpenIngestModal('audio', undefined, undefined, false, true)}
            onOpenPdfModal={() => handleOpenIngestModal('pdf', undefined, undefined, false, false)}
            onSelectOnMap={(obs) => {
              setActiveView('map');
            }}
            onCreateTask={handleCreateTaskFromObservation}
            onDeleteObservation={handleDeleteObservation}
          />
        )}

        {/* STEP 3: AI DAILY SITE REPORT (DSR) */}
        {activeView === 'report' && (
          <DailyReportView
            observations={observations}
            tasks={tasks}
          />
        )}

        {/* WBS SCHEDULE & KANBAN TASKS */}
        {activeView === 'tasks' && (
          <div className="space-y-6">
            {!user && !authLoading && (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Real-Time Firestore Database Synchronized
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sign in to store WBS tasks, shift schedules, and drag-and-drop board orders across all devices.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => signInAsGuest()}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    Guest Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-xs transition-colors cursor-pointer"
                  >
                    Sign In / Register
                  </button>
                </div>
              </div>
            )}

            <FilterBar
              search={search}
              onSearchChange={setSearch}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              disciplineFilter={disciplineFilter}
              onDisciplineFilterChange={setDisciplineFilter}
              viewMode={taskViewMode}
              onViewModeChange={setTaskViewMode}
              disciplines={disciplines}
              totalTasks={totalTasks}
              completedTasks={completedTasks}
              criticalTasks={criticalTasks}
              onExportCsv={handleExportCsv}
              onExportCalendar={handleExportCalendar}
            />

            {taskViewMode === 'kanban' ? (
              <KanbanBoard
                tasks={filteredTasks}
                onEditTask={handleOpenEditModal}
                onDeleteTask={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onReorderTasks={handleReorderTasks}
                onOpenCreateModal={handleOpenCreateModal}
              />
            ) : (
              <ListView
                tasks={filteredTasks}
                onEditTask={handleOpenEditModal}
                onDeleteTask={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onSort={handleSort}
                sortField={sortField}
                sortAsc={sortAsc}
              />
            )}
          </div>
        )}
      </main>

      {/* Engineering Footer with Telemetry Datum */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-4 mt-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">SitePulse INFRA 4.0</span>
            <span>•</span>
            <span>Multimodal Ingestion & Verification</span>
            <span>•</span>
            <span>Real-time EVM Sync</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportCsv}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Export CSV
            </button>
            <span>•</span>
            <button
              onClick={handleExportCalendar}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Calendar (.ics)
            </button>
            <span>•</span>
            <span className="text-slate-400 dark:text-slate-600 font-mono text-[11px]">v2.4.0</span>
          </div>
        </div>
      </footer>

      {/* Multimodal Ingestion Modal (Step 1) */}
      <MultimodalIngestModal
        isOpen={isIngestModalOpen}
        onClose={() => {
          setIsIngestModalOpen(false);
          setAutoStartCamera(false);
          setAutoStartRecording(false);
        }}
        onSaveObservation={handleSaveObservation}
        initialZoneId={ingestZoneId}
        initialCoords={ingestCoords}
        initialTab={ingestTab}
        autoStartCamera={autoStartCamera}
        autoStartRecording={autoStartRecording}
      />

      {/* Real-time Site Update Confirmation Notification */}
      {siteUpdateToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex items-start gap-3.5 animate-slide-up"
        >
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Site Data Synchronized
              </span>
              <button
                type="button"
                onClick={() => setSiteUpdateToast(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold p-1 cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-1">
              {siteUpdateToast.title}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {siteUpdateToast.message}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveView('ingest');
                  setSiteUpdateToast(null);
                }}
                className="text-[11px] font-semibold text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                View in Ingest Hub
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('map');
                  setSiteUpdateToast(null);
                }}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                Locate on CAD Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        taskToEdit={editingTask}
        defaultStatus={createDefaultStatus}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleCreateOrUpdateTask}
      />

      {/* Secure Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <NetworkProvider>
      <AuthProvider>
        <TaskManagementApp />
      </AuthProvider>
    </NetworkProvider>
  );
}
