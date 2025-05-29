export const PAYMENT_TIERS = {
  good_payer: {
    label: 'Good Payer',
    color: 'green',
    description: 'Consistent payment history with minimal delays',
    recommendation: 'APPROVE'
  },
  mid_payer: {
    label: 'Mid Payer',
    color: 'yellow',
    description: 'Occasional late payments or payment issues',
    recommendation: 'CAUTION'
  },
  non_payer: {
    label: 'Non-Payer',
    color: 'red',
    description: 'Frequent late payments or outstanding balances',
    recommendation: 'REJECT'
  }
} as const;

export const PAYMENT_STATUSES = {
  pending: {
    label: 'Pending',
    color: 'blue'
  },
  paid: {
    label: 'Paid',
    color: 'green'
  },
  overdue: {
    label: 'Overdue',
    color: 'red'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'gray'
  }
} as const;

export const ALERT_SEVERITIES = {
  low: {
    label: 'Low',
    color: 'blue'
  },
  medium: {
    label: 'Medium',
    color: 'yellow'
  },
  high: {
    label: 'High',
    color: 'red'
  }
} as const;

export const USER_ROLES = {
  system_admin: {
    label: 'System Administrator',
    permissions: ['manage_all', 'view_all', 'export_data']
  },
  daycare_admin: {
    label: 'Daycare Administrator',
    permissions: ['manage_daycare', 'view_parents', 'create_enrollments']
  }
} as const;
