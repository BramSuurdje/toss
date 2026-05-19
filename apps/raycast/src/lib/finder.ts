import { getSelectedFinderItems } from "@raycast/api"
import { stat } from "fs/promises"
import { basename } from "path"

export type FinderFile = {
  path: string
  name: string
  size: number
}

export async function getFinderSelection(): Promise<FinderFile[]> {
  const selected = await getSelectedFinderItems()
  const files: FinderFile[] = []

  for (const item of selected) {
    const info = await stat(item.path)
    if (!info.isFile()) {
      continue
    }
    files.push({
      path: item.path,
      name: basename(item.path),
      size: info.size,
    })
  }

  return files
}
