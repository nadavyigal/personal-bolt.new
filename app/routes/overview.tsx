import { json } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { useCallback, useEffect, useState } from 'react';
import { Header } from '~/components/header/Header';
import { HistoryItem } from '~/components/sidebar/HistoryItem';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { db, deleteById, getAll, type ChatHistoryItem } from '~/lib/persistence';
import { toast } from 'react-toastify';

export const loader = () => json({});

export default function Overview() {
  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      <ClientOnly fallback={<div className="p-4">Loading...</div>}>
        {() => <OverviewClient />}
      </ClientOnly>
    </div>
  );
}

function OverviewClient() {
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [dialogItem, setDialogItem] = useState<ChatHistoryItem | null>(null);

  const loadEntries = useCallback(() => {
    if (!db) return;
    getAll(db)
      .then((items) => items.filter((i) => i.urlId && i.description))
      .then(setList)
      .catch((error) => toast.error(error.message));
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  function handleDelete(item: ChatHistoryItem) {
    if (!db) return;
    deleteById(db, item.id)
      .then(() => {
        loadEntries();
        setDialogItem(null);
      })
      .catch(() => toast.error('Failed to delete conversation'));
  }

  if (!db) {
    return <div className="p-4">Chat persistence is unavailable.</div>;
  }

  return (
    <div className="flex-1 overflow-auto p-4 space-y-1">
      {list.length === 0 && <div className="pl-2 text-bolt-elements-textTertiary">No saved projects</div>}
      <DialogRoot open={dialogItem !== null}>
        {list.map((item) => (
          <HistoryItem key={item.id} item={item} onDelete={() => setDialogItem(item)} />
        ))}
        <Dialog onBackdrop={() => setDialogItem(null)} onClose={() => setDialogItem(null)}>
          {dialogItem && (
            <>
              <DialogTitle>Delete Chat?</DialogTitle>
              <DialogDescription asChild>
                <div>
                  <p>
                    You are about to delete <strong>{dialogItem.description}</strong>.
                  </p>
                  <p className="mt-1">Are you sure you want to delete this chat?</p>
                </div>
              </DialogDescription>
              <div className="px-5 pb-4 bg-bolt-elements-background-depth-2 flex gap-2 justify-end">
                <DialogButton type="secondary" onClick={() => setDialogItem(null)}>
                  Cancel
                </DialogButton>
                <DialogButton type="danger" onClick={() => handleDelete(dialogItem)}>
                  Delete
                </DialogButton>
              </div>
            </>
          )}
        </Dialog>
      </DialogRoot>
    </div>
  );
}

