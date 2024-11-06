import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface CreatePlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (playlistName: string) => void;
  userName: string;
}

export function CreatePlaylistDialog({
  isOpen,
  onClose,
  onConfirm,
  userName,
}: CreatePlaylistDialogProps) {
  const defaultName = userName ? `${userName}'s Top Tracks` : "My Top Tracks";
  const [playlistName, setPlaylistName] = useState(defaultName);

  // Reset playlist name when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPlaylistName(defaultName);
    }
  }, [isOpen, userName, defaultName]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#282828] border-[#1DB954] w-[90vw] max-w-[425px] p-4 sm:p-6 rounded-xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-white">
            Create Playlist
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-[#b3b3b3]">
            Enter a name for your new playlist
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 sm:py-4">
          <Input
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            className="bg-[#3e3e3e] border-[#1DB954] text-white text-sm sm:text-base h-9 sm:h-10"
            placeholder="Playlist name"
          />
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto bg-transparent text-white border-[#1DB954] hover:bg-[#1DB954] hover:text-black text-sm sm:text-base h-9 sm:h-10"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(playlistName)}
            className="w-full sm:w-auto bg-[#1DB954] text-black hover:bg-[#22c55e] text-sm sm:text-base h-9 sm:h-10"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
