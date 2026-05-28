/** Status pills tuned for dark partner theme */

export function projectStatusClass(status: string): string {
  switch (status) {
    case 'active':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 [&_.status-dot]:bg-emerald-500'
    case 'inactive':
      return 'border-border bg-secondary text-muted-foreground [&_.status-dot]:bg-muted-foreground'
    case 'archived':
      return 'border-border bg-secondary/60 text-muted-foreground [&_.status-dot]:bg-muted-foreground'
    default:
      return 'border-border bg-secondary text-muted-foreground [&_.status-dot]:bg-muted-foreground'
  }
}

export function tgStatusClass(status: string): string {
  switch (status) {
    case 'live':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 [&_.status-dot]:bg-emerald-500'
    case 'paused':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-400 [&_.status-dot]:bg-amber-500'
    case 'draft':
      return 'border-border bg-secondary text-muted-foreground [&_.status-dot]:bg-muted-foreground'
    case 'closed':
      return 'border-red-500/30 bg-red-500/10 text-red-400 [&_.status-dot]:bg-red-500'
    case 'archived':
      return 'border-border bg-secondary/60 text-muted-foreground [&_.status-dot]:bg-muted-foreground'
    default:
      return 'border-border bg-secondary text-muted-foreground [&_.status-dot]:bg-muted-foreground'
  }
}

export function sessionStatusClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 [&_.status-dot]:bg-emerald-500'
    case 'terminated':
    case 'security_terminated':
      return 'border-red-500/30 bg-red-500/10 text-red-400 [&_.status-dot]:bg-red-500'
    case 'fraud_hold':
      return 'border-red-500/40 bg-red-500/15 text-red-300 [&_.status-dot]:bg-red-500'
    case 'prescreened':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-400 [&_.status-dot]:bg-blue-500'
    case 'started':
    case 'never_reached_client':
      return 'border-border bg-secondary text-muted-foreground [&_.status-dot]:bg-muted-foreground'
    case 'dropped':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-400 [&_.status-dot]:bg-amber-500'
    case 'quota_full':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-400 [&_.status-dot]:bg-orange-500'
    default:
      return 'border-border bg-secondary text-muted-foreground [&_.status-dot]:bg-muted-foreground'
  }
}

export function reportStatusClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 [&_.status-dot]:bg-emerald-500'
    case 'processing':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-400 [&_.status-dot]:bg-amber-500'
    case 'failed':
      return 'border-red-500/30 bg-red-500/10 text-red-400 [&_.status-dot]:bg-red-500'
    default:
      return 'border-border bg-secondary text-muted-foreground [&_.status-dot]:bg-muted-foreground'
  }
}
