import { toast } from "@transferflow/ui/components/toast"

import { checkUploadAccess } from "@/lib/api"
import {
  clearInternalKey,
  consumeKeyCapturedThisLoad,
  getInternalKey,
  hasUnlimitedUpload,
  markUnlimitedUploadVerified,
} from "@/lib/internal-key"

export async function activateInternalKeyOnLoad(): Promise<void> {
  if (!getInternalKey()) {
    return
  }

  if (hasUnlimitedUpload()) {
    return
  }

  const showToast = consumeKeyCapturedThisLoad()

  try {
    const { unlimited } = await checkUploadAccess()
    if (!unlimited) {
      clearInternalKey()
      return
    }

    markUnlimitedUploadVerified()
    if (showToast) {
      toast.success("Upload limit increased to unlimited")
    }
  } catch {
    clearInternalKey()
  }
}
