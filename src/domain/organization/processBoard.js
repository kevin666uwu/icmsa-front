export function moveProcess(draft, identity, lane) {
  return { responsible_ids: [...draft.responsible_ids.filter(id => id !== identity), ...(lane === 'responsible' ? [identity] : [])],
    related_ids: [...draft.related_ids.filter(id => id !== identity), ...(lane === 'related' ? [identity] : [])] };
}
