import { AssistantContext, AvatarOption } from '../models/assistant.model';

export const AVATAR_LIST: AvatarOption[] = [
  { id: 'avatar',  label: 'Avatar',   path: '/assets/avatar.glb',   emoji: '🧑' },
  { id: 'avatar1', label: 'Avatar 1', path: '/assets/avatar-1.glb', emoji: '🧑' },
  { id: 'avatar2', label: 'Avatar 2', path: '/assets/avatar-2.glb', emoji: '🧑' },
  { id: 'avatar3', label: 'Avatar 3', path: '/assets/avatar-3.glb', emoji: '🧑' },
  { id: 'avatar4', label: 'Avatar 4', path: '/assets/avatar-4.glb', emoji: '👩' },
  { id: 'avatar6', label: 'Avatar 6', path: '/assets/avatar-6.glb', emoji: '👩' },
];

export const DEFAULT_CONTEXT: AssistantContext = {
  pageId: 'default',
  pageTitle: 'Organiflow',
  description: 'Plataforma de gestión de workflows empresariales de Organiflow.',
};

export const PAGE_CONTEXTS: { pattern: RegExp; context: AssistantContext }[] = [
  {
    pattern: /^\/admin\/workflows\/[^/]+\/edit/,
    context: {
      pageId: 'workflow-editor',
      pageTitle: 'Editor de Workflow',
      description:
        'Editor visual de workflow con canvas de nodos y conexiones. El administrador diseña políticas de negocio arrastrando nodos (START, TASK, CONDITION, MERGE, END) y conectándolos en carriles por departamento.',
    },
  },
  {
    pattern: /^\/admin\/dashboard/,
    context: {
      pageId: 'admin-dashboard',
      pageTitle: 'Panel de Administración',
      description:
        'Panel principal del administrador con resumen de actividad del sistema, workflows activos y ejecuciones recientes.',
    },
  },
  {
    pattern: /^\/admin\/workflows/,
    context: {
      pageId: 'admin-workflows',
      pageTitle: 'Workflows',
      description:
        'Lista de workflows (políticas de negocio) creados por el administrador. Permite crear, editar y activar/desactivar workflows.',
    },
  },
  {
    pattern: /^\/admin\/departments\/[^/]+/,
    context: {
      pageId: 'department-detail',
      pageTitle: 'Detalle de Departamento',
      description:
        'Vista detallada de un departamento con sus funcionarios y tareas asociadas.',
    },
  },
  {
    pattern: /^\/admin\/departments/,
    context: {
      pageId: 'admin-departments',
      pageTitle: 'Departamentos',
      description:
        'Gestión de departamentos y áreas de la organización. Permite crear departamentos y asignar funcionarios.',
    },
  },
  {
    pattern: /^\/admin\/users/,
    context: {
      pageId: 'admin-users',
      pageTitle: 'Usuarios',
      description:
        'Gestión de usuarios del sistema: administradores, funcionarios y usuarios finales.',
    },
  },
  {
    pattern: /^\/admin\/notifications/,
    context: {
      pageId: 'admin-notifications',
      pageTitle: 'Notificaciones',
      description: 'Centro de notificaciones del administrador.',
    },
  },
  {
    pattern: /^\/officer\/tasks\/[^/]+/,
    context: {
      pageId: 'task-detail',
      pageTitle: 'Detalle de Tarea',
      description:
        'Vista detallada de una tarea asignada al funcionario. El funcionario puede completar el formulario asociado al nodo del workflow.',
    },
  },
  {
    pattern: /^\/officer\/tasks/,
    context: {
      pageId: 'officer-tasks',
      pageTitle: 'Mis Tareas',
      description:
        'Lista de tareas pendientes asignadas al funcionario para completar dentro de los workflows activos.',
    },
  },
  {
    pattern: /^\/officer\/completed/,
    context: {
      pageId: 'officer-completed',
      pageTitle: 'Tareas Completadas',
      description: 'Historial de tareas completadas por el funcionario.',
    },
  },
  {
    pattern: /^\/officer\/profile/,
    context: {
      pageId: 'officer-profile',
      pageTitle: 'Mi Perfil',
      description: 'Perfil del funcionario con datos personales y configuración.',
    },
  },
  {
    pattern: /^\/user\/executions\/[^/]+/,
    context: {
      pageId: 'execution-detail',
      pageTitle: 'Detalle de Solicitud',
      description:
        'Vista detallada de una ejecución de workflow. Muestra el estado actual, los pasos completados y los pendientes.',
    },
  },
  {
    pattern: /^\/user\/executions/,
    context: {
      pageId: 'user-executions',
      pageTitle: 'Mis Solicitudes',
      description:
        'Lista de solicitudes (ejecuciones de workflow) iniciadas por el usuario. Muestra el estado en tiempo real.',
    },
  },
  {
    pattern: /^\/user\/new-request/,
    context: {
      pageId: 'new-request',
      pageTitle: 'Nueva Solicitud',
      description:
        'Formulario para iniciar una nueva solicitud seleccionando la política de negocio (workflow) que aplica a la necesidad del usuario.',
    },
  },
  {
    pattern: /^\/user\/forms\/[^/]+/,
    context: {
      pageId: 'form-detail',
      pageTitle: 'Completar Formulario',
      description:
        'Formulario asignado al usuario para completar información requerida en un paso del workflow.',
    },
  },
  {
    pattern: /^\/user\/forms/,
    context: {
      pageId: 'user-forms',
      pageTitle: 'Formularios Pendientes',
      description: 'Lista de formularios pendientes que el usuario debe completar.',
    },
  },
  {
    pattern: /^\/user\/history/,
    context: {
      pageId: 'user-history',
      pageTitle: 'Historial',
      description: 'Historial completo de solicitudes y actividad del usuario.',
    },
  },
  {
    pattern: /^\/user\/profile/,
    context: {
      pageId: 'user-profile',
      pageTitle: 'Mi Perfil',
      description: 'Perfil del usuario con datos personales y configuración.',
    },
  },
  {
    pattern: /\/notifications/,
    context: {
      pageId: 'notifications',
      pageTitle: 'Notificaciones',
      description: 'Centro de notificaciones con alertas del sistema y actualizaciones de tareas.',
    },
  },
];
