/* eslint-disable prettier/prettier */
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {
  getNoteForgeNotesPath,
  ensureNoteForgeNotesFolder,
  createNotebookFolder,
  loadNotebooksFromFilesystem,
  loadNotesFromFilesystem,
  createWelcomeNoteIfNewUser
} from './fileManager'
import { saveMarkdown, deleteMarkdown, deleteNotebookFolderSafe } from './mdStorage'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handlers para manejo de archivos
  ipcMain.handle(
    'save-note-to-file',
    async (_event, noteId: string, title: string, content: string, notebookId?: string) => {
      try {
        const filePath = saveMarkdown(noteId, title, content, notebookId)
        return { success: true, filePath }
      } catch (error) {
        console.error('Error al guardar la nota:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  )

  ipcMain.handle(
    'delete-note-file',
    async (_event, noteId: string, title: string, notebookId?: string) => {
      try {
        const deleted = deleteMarkdown(noteId, title, notebookId)
        return { success: deleted }
      } catch (error) {
        console.error('Error al eliminar nota:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  )

  ipcMain.handle('get-noteforge-notes-path', async () => {
    try {
      const path = getNoteForgeNotesPath()
      return { success: true, path }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('delete-notebook-folder', async (_event, notebookId: string) => {
    try {
      const deleted = deleteNotebookFolderSafe(notebookId)
      return { success: deleted }
    } catch (error) {
      console.error('Error al eliminar carpeta de notebook:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle(
    'create-notebook-folder',
    async (_event, notebookId: string, notebookName: string) => {
      try {
        const folderPath = createNotebookFolder(notebookId, notebookName)
        return { success: true, folderPath }
      } catch (error) {
        console.error('Error al crear carpeta de notebook:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  )

  ipcMain.handle('load-notebooks', async () => {
    try {
      const notebooks = loadNotebooksFromFilesystem()
      return { success: true, notebooks }
    } catch (error) {
      console.error('Error al cargar notebooks:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        notebooks: []
      }
    }
  })

  ipcMain.handle('load-notes', async () => {
    try {
      const notes = loadNotesFromFilesystem()
      return { success: true, notes }
    } catch (error) {
      console.error('Error al cargar notas:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        notes: []
      }
    }
  })

  ipcMain.handle('open-data-folder', async () => {
    try {
      const path = getNoteForgeNotesPath()
      shell.showItemInFolder(path)
      return { success: true }
    } catch (error) {
      console.error('Error al abrir carpeta de datos:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Asegurar que la carpeta existe al iniciar
  ensureNoteForgeNotesFolder()

  // Create note de bienvenida si el usuario es nuevo
  createWelcomeNoteIfNewUser()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
