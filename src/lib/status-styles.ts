/** Outline-style status pills (Cint Exchange inspired) */
export function projectStatusClass(status: string): string {
  switch (status) {
    case 'active':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 [&_.status-dot]:bg-emerald-500'
    case 'inactive':
      return 'border-slate-200 bg-slate-50 text-slate-600 [&_.status-dot]:bg-slate-400'
    case 'archived':
      return 'border-slate-200 bg-slate-50 text-slate-500 [&_.status-dot]:bg-slate-400'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600 [&_.status-dot]:bg-slate-400'
  }
}

export function tgStatusClass(status: string): string {
  switch (status) {
    case 'live':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 [&_.status-dot]:bg-emerald-500'
    case 'paused':
      return 'border-amber-200 bg-amber-50 text-amber-700 [&_.status-dot]:bg-amber-500'
    case 'draft':
      return 'border-slate-200 bg-slate-50 text-slate-600 [&_.status-dot]:bg-slate-400'
    case 'closed':
      return 'border-red-200 bg-red-50 text-red-700 [&_.status-dot]:bg-red-500'
    case 'archived':
      return 'border-slate-200 bg-slate-50 text-slate-500 [&_.status-dot]:bg-slate-400'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600 [&_.status-dot]:bg-slate-400'
  }
}

export function sessionStatusClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 [&_.status-dot]:bg-emerald-500'
    case 'terminated':
    case 'security_terminated':
      return 'border-red-200 bg-red-50 text-red-700 [&_.status-dot]:bg-red-500'
    case 'fraud_hold':
      return 'border-red-300 bg-red-100 text-red-800 [&_.status-dot]:bg-red-700'
    case 'prescreened':
      return 'border-blue-200 bg-blue-50 text-blue-700 [&_.status-dot]:bg-blue-500'
    case 'started':
    case 'never_reached_client':
      return 'border-slate-200 bg-slate-50 text-slate-600 [&_.status-dot]:bg-slate-400'
    case 'dropped':
      return 'border-amber-200 bg-amber-50 text-amber-700 [&_.status-dot]:bg-amber-500'
    case 'quota_full':
      return 'border-orange-200 bg-orange-50 text-orange-700 [&_.status-dot]:bg-orange-500'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600 [&_.status-dot]:bg-slate-400'
  }
}

export function reportStatusClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 [&_.status-dot]:bg-emerald-500'
    case 'processing':
      return 'border-amber-200 bg-amber-50 text-amber-700 [&_.status-dot]:bg-amber-500'
    case 'failed':
      return 'border-red-200 bg-red-50 text-red-700 [&_.status-dot]:bg-red-500'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600 [&_.status-dot]:bg-slate-400'
  }
}
