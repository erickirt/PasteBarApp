import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api'
import { confirm } from '@tauri-apps/api/dialog'
import { CopyComponent } from '~/libs/bbcode'
import i18n from '~/locales'
import { LANGUAGES } from '~/locales/languges'
import {
  clipNotesDelays,
  clipNotesSizes,
  fontSizeIncrements,
  settingsStoreAtom,
  themeStoreAtom,
  uiStoreAtom,
} from '~/store'
import { useAtomValue } from 'jotai'
import {
  BookOpenText,
  Contact,
  FileText,
  MessageSquare,
  MessageSquareDashed,
  MessageSquareText,
  NotebookPen,
  Plus,
  Trash2,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import AutoSize from 'react-virtualized-auto-sizer'

import Spacer from '~/components/atoms/spacer'
import ToolTipNotes from '~/components/atoms/tooltip-notes'
import { Icons } from '~/components/icons'
import SimpleBar from '~/components/libs/simplebar-react'
import InputField from '~/components/molecules/input'
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Flex,
  Switch,
  Text,
  TextNormal,
} from '~/components/ui'

import md from '~/store/example.md?raw'

import { NoteIconType } from '../components/Dashboard/components/utils'
import CustomDatabaseLocationSettings from './CustomDatabaseLocationSettings'
import GlobalTemplatesSettings from './GlobalTemplatesSettings'

export default function UserPreferences() {
  const { t } = useTranslation()

  const {
    isSkipAutoStartPrompt,
    setIsSkipAutoStartPrompt,
    isShowCollectionNameOnNavBar,
    setIsShowCollectionNameOnNavBar,
    isHideCollectionsOnNavBar,
    setIsHideCollectionsOnNavBar,
    isShowNavBarItemsOnHoverOnly,
    setIsShowNavBarItemsOnHoverOnly,
    isClipNotesHoverCardsEnabled,
    setIsClipNotesHoverCardsEnabled,
    clipNotesMaxHeight,
    clipNotesMaxWidth,
    setClipNotesMaxHeight,
    setClipNotesMaxWidth,
    clipNotesHoverCardsDelayMS,
    setClipNotesHoverCardsDelayMS,
    isShowDisabledCollectionsOnNavBarMenu,
    setIsShowDisabledCollectionsOnNavBarMenu,
    setIsHideMacOSDockIcon,
    isHideMacOSDockIcon,
    isKeepMainWindowClosedOnRestartEnabled,
    setIsKeepMainWindowClosedOnRestartEnabled,
    hotKeysShowHideMainAppWindow,
    hotKeysShowHideQuickPasteWindow,
    setHotKeysShowHideMainAppWindow,
    setHotKeysShowHideQuickPasteWindow,
    isNoteIconsEnabled,
    setIsNoteIconsEnabled,
    defaultNoteIconType,
    setDefaultNoteIconType,
    isMenuItemCopyOnlyEnabled,
    setIsMenuItemCopyOnlyEnabled,
    isHistoryPanelVisibleOnly,
    setIsHistoryPanelVisibleOnly,
    isSavedClipsPanelVisibleOnly,
    setShowBothPanels,
    setIsSavedClipsPanelVisibleOnly,
    isSimplifiedLayout,
    setIsSimplifiedLayout,
    isQuickPasteCopyOnly,
    setIsQuickPasteCopyOnly,
    isQuickPasteAutoClose,
    setIsQuickPasteAutoClose,
    isSingleClickToCopyPaste,
    setIsSingleClickToCopyPaste,
    isSingleClickKeyboardFocus, // New state
    setIsSingleClickKeyboardFocus, // New setter
    isSingleClickToCopyPasteQuickWindow,
    setIsSingleClickToCopyPasteQuickWindow,
    isDoubleClickTrayToOpenEnabledOnWindows,
    setIsDoubleClickTrayToOpenEnabledOnWindows,
    isLeftClickTrayToOpenEnabledOnWindows,
    setIsLeftClickTrayToOpenEnabledOnWindows,
    isLeftClickTrayDisabledOnWindows,
    setIsLeftClickTrayDisabledOnWindows,
  } = useAtomValue(settingsStoreAtom)

  const {
    setFontSize,
    fontSize,
    setIsSwapPanels,
    isSwapPanels,
    returnRoute,
    isWindows,
    isMacOSX,
  } = useAtomValue(uiStoreAtom)

  const isSinglePanelView = isHistoryPanelVisibleOnly || isSavedClipsPanelVisibleOnly

  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false)

  const { setTheme, theme } = useTheme()
  const { mode, setMode, themeDark } = useAtomValue(themeStoreAtom)

  useEffect(() => {
    if (theme !== mode) {
      setMode(theme)
    }
  }, [theme, mode, setMode]) // Added mode and setMode to dependency array

  useEffect(() => {
    invoke('is_autostart_enabled').then(isEnabled => {
      setIsAutoStartEnabled(Boolean(isEnabled))
    })
  }, [])

  const isDark = themeDark()

  const [mainAppHotkey, setMainAppHotkey] = useState('')
  const [quickPasteHotkey, setQuickPasteHotkey] = useState('')
  const [currentKeyPreview, setCurrentKeyPreview] = useState('')

  const [isEditingMainApp, setIsEditingMainApp] = useState(false)
  const [isEditingQuickPaste, setIsEditingQuickPaste] = useState(false)

  useEffect(() => {
    if (hotKeysShowHideMainAppWindow !== mainAppHotkey) {
      setMainAppHotkey(hotKeysShowHideMainAppWindow)
    }
    if (hotKeysShowHideQuickPasteWindow !== quickPasteHotkey) {
      setQuickPasteHotkey(hotKeysShowHideQuickPasteWindow)
    }
  }, [hotKeysShowHideMainAppWindow, hotKeysShowHideQuickPasteWindow])
  // Removed mainAppHotkey, quickPasteHotkey from local state dependencies in the original thought process,
  // as they are set inside this effect. The effect correctly depends on props.

  const handleKeyDown = (
    event: KeyboardEvent | React.KeyboardEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    event.preventDefault()
    const { ctrlKey, shiftKey, altKey, metaKey, key } = event

    if (key === 'Escape' || key === 'Esc' || key === 'Backspace' || key === 'Delete') {
      setter('')
      setCurrentKeyPreview('')
      return
    }

    if (key === 'Enter') {
      if (setter === setMainAppHotkey) {
        setHotKeysShowHideMainAppWindow(mainAppHotkey)
        setIsEditingMainApp(false)
      } else {
        setHotKeysShowHideQuickPasteWindow(quickPasteHotkey)
        setIsEditingQuickPaste(false)
      }
      setCurrentKeyPreview('')
      return
    }

    const pressedKeys = []
    let modifierCount = 0
    let hasNonModifier = false

    // Collect modifier keys
    if (ctrlKey) {
      pressedKeys.push('Ctrl')
      modifierCount++
    }
    if (shiftKey) {
      pressedKeys.push('Shift')
      modifierCount++
    }
    if (altKey) {
      pressedKeys.push('Alt')
      modifierCount++
    }
    if (metaKey) {
      pressedKeys.push('Cmd')
      modifierCount++
    }

    // Add non-modifier key
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      let keyName = key
      // Handle special keys
      if (key === ' ') {
        keyName = 'Space'
      } else if (key.length === 1) {
        keyName = key.toUpperCase()
      } else {
        // Handle function keys, arrow keys, etc.
        keyName = key.charAt(0).toUpperCase() + key.slice(1)
      }
      pressedKeys.push(keyName)
      hasNonModifier = true
    }

    const keyCombo = pressedKeys.join('+')
    setCurrentKeyPreview(keyCombo)

    // Allow combinations with at least 1 modifier and 1 non-modifier key
    // Support up to 3 modifier keys + 1 regular key (4 keys total)
    // Example: Ctrl+Alt+Cmd+B (3 modifiers + 1 key)
    if (hasNonModifier && modifierCount >= 1 && modifierCount <= 3) {
      setter(keyCombo)
    }
  }

  const handleKeyUp = () => {
    // Clear preview when keys are released
    setCurrentKeyPreview('')
  }

  function convertMsToSeconds(milliseconds: number) {
    const seconds = milliseconds / 1000
    const formattedSeconds = Number.isInteger(seconds)
      ? seconds.toString()
      : seconds.toFixed(1)
    const translatedUnit = seconds === 1 ? ' ' + t('second') : ' ' + t('seconds')
    return formattedSeconds + translatedUnit
  }
  return (
    <AutoSize disableWidth>
      {({ height }) => {
        return (
          height && (
            <Box className="p-4 py-6 select-none min-w-[320px]">
              <Box className="text-xl my-2 mx-2 flex items-center justify-between">
                <Text className="light">{t('User Preferences', { ns: 'settings' })}</Text>
                <Link to={returnRoute} replace>
                  <Button
                    variant="ghost"
                    className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                    size="sm"
                  >
                    {t('Back', { ns: 'common' })}
                  </Button>
                </Link>
              </Box>
              <Spacer h={3} />

              <SimpleBar style={{ maxHeight: height - 85 }} autoHide={true}>
                <Box className="animate-in fade-in max-w-xl">
                  <Card
                    className={`${
                      !isAutoStartEnabled && 'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Application Auto Start', { ns: 'settings' })}
                      </CardTitle>
                      <Switch
                        checked={isAutoStartEnabled}
                        className="ml-auto"
                        onCheckedChange={async () => {
                          await invoke('autostart', { enabled: !isAutoStartEnabled })
                          setIsAutoStartEnabled(!isAutoStartEnabled)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t('Enable application auto start on system boot', {
                          ns: 'settings',
                        })}
                      </Text>

                      {!isAutoStartEnabled && (
                        <Flex className="items-center justify-start mt-2 ml-[-12px]">
                          <Checkbox
                            color="default"
                            checked={isSkipAutoStartPrompt}
                            classNameLabel="py-1"
                            onChange={() => {
                              setIsSkipAutoStartPrompt(!isSkipAutoStartPrompt)
                            }}
                          >
                            <TextNormal size="sm">
                              {t('Skip auto start prompt on app launch', {
                                ns: 'settings',
                              })}
                            </TextNormal>
                          </Checkbox>
                        </Flex>
                      )}
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isKeepMainWindowClosedOnRestartEnabled
                        ? 'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        : ''
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Application Starts with Main Window Hidden', {
                          ns: 'settings2',
                        })}
                      </CardTitle>
                      <Switch
                        checked={isKeepMainWindowClosedOnRestartEnabled}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsKeepMainWindowClosedOnRestartEnabled(
                            !isKeepMainWindowClosedOnRestartEnabled
                          )
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'Keep the main application window hidden when the app restarts. You can reopen it using the menu bar or taskbar menu, or using global hotkeys.',
                          { ns: 'settings2' }
                        )}
                      </Text>
                    </CardContent>
                  </Card>
                </Box>

                {isWindows && (
                  <Box className="animate-in fade-in max-w-xl mt-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="animate-in fade-in text-md font-medium">
                          {t('Tray Icon Behavior on Windows', { ns: 'settings2' })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Text className="text-sm text-muted-foreground mb-4">
                          {t(
                            'Configure how the system tray icon responds to mouse clicks',
                            {
                              ns: 'settings2',
                            }
                          )}
                        </Text>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Text className="text-[15px] font-semibold">
                                {t('Double-click toggles app visibility', {
                                  ns: 'settings2',
                                })}
                              </Text>
                              <Text className="text-xs text-muted-foreground">
                                {t(
                                  'Double-clicking the tray icon shows or hides the main application window',
                                  { ns: 'settings2' }
                                )}
                              </Text>
                            </div>
                            <Switch
                              checked={isDoubleClickTrayToOpenEnabledOnWindows}
                              onCheckedChange={() => {
                                if (
                                  isLeftClickTrayToOpenEnabledOnWindows &&
                                  !isDoubleClickTrayToOpenEnabledOnWindows
                                ) {
                                  setIsLeftClickTrayToOpenEnabledOnWindows(false)
                                }
                                setIsDoubleClickTrayToOpenEnabledOnWindows(
                                  !isDoubleClickTrayToOpenEnabledOnWindows
                                )
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Text className="text-[15px] font-semibold">
                                {t('Left-click toggles app visibility', {
                                  ns: 'settings2',
                                })}
                              </Text>
                              <Text className="text-xs text-muted-foreground">
                                {t(
                                  'Left-clicking the tray icon shows or hides the main application window',
                                  { ns: 'settings2' }
                                )}
                              </Text>
                            </div>
                            <Switch
                              checked={isLeftClickTrayToOpenEnabledOnWindows}
                              onCheckedChange={() => {
                                if (
                                  isDoubleClickTrayToOpenEnabledOnWindows &&
                                  !isLeftClickTrayToOpenEnabledOnWindows
                                ) {
                                  setIsDoubleClickTrayToOpenEnabledOnWindows(false)
                                }
                                setIsLeftClickTrayToOpenEnabledOnWindows(
                                  !isLeftClickTrayToOpenEnabledOnWindows
                                )
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Text className="text-[15px] font-semibold">
                                {t('Disable left-click context menu', {
                                  ns: 'settings2',
                                })}
                              </Text>
                              <Text className="text-xs text-muted-foreground">
                                {t(
                                  'Prevents the context menu from appearing when left-clicking the tray icon',
                                  { ns: 'settings2' }
                                )}
                              </Text>
                            </div>
                            <Switch
                              checked={isLeftClickTrayDisabledOnWindows}
                              onCheckedChange={() => {
                                setIsLeftClickTrayDisabledOnWindows(
                                  !isLeftClickTrayDisabledOnWindows
                                )
                              }}
                            />
                          </div>
                        </div>

                        {(isLeftClickTrayToOpenEnabledOnWindows ||
                          isLeftClickTrayDisabledOnWindows) && (
                          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-300 dark:border-blue-600">
                            <Text className="text-xs text-blue-700 dark:text-blue-300">
                              {t(
                                'Enabling either left-click option will disable the context menu to ensure proper functionality.',
                                {
                                  ns: 'settings2',
                                }
                              )}
                            </Text>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                )}

                <CustomDatabaseLocationSettings />

                <Spacer h={6} />

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card>
                    <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full mb-3">
                        {t('Application UI Fonts Scale', { ns: 'settings' })}
                        <Text className="text-sm text-muted-foreground mt-2">
                          {t('Change the application user interface font size scale', {
                            ns: 'settings',
                          })}
                        </Text>
                      </CardTitle>
                      <Flex className="gap-3 flex-wrap items-start justify-start">
                        {fontSizeIncrements.map((size, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            onClick={() => {
                              setFontSize(size)
                            }}
                            className={`text-sm font-normal bg-slate-50 dark:bg-slate-950 ${
                              fontSize === size
                                ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                                : ''
                            } dark:text-slate-200 px-2 !py-0.5`}
                          >
                            {size}
                          </Button>
                        ))}
                      </Flex>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={fontSize === '100%'}
                        onClick={() => {
                          setFontSize('100%')
                        }}
                        className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200 mt-1"
                      >
                        {t('Reset', { ns: 'common' })}
                      </Button>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card>
                    <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-1 mb-4">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full mb-3">
                        {t('Application UI Color Theme', { ns: 'settings' })}
                        <Text className="text-sm text-muted-foreground mt-2">
                          {t('Change the application user interface color theme', {
                            ns: 'settings',
                          })}
                        </Text>
                      </CardTitle>
                      <Flex className="gap-3 flex-wrap items-start justify-start">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setTheme('light')
                          }}
                          className={`text-sm border-0 font-normal bg-slate-50 dark:bg-slate-950 ${
                            theme === 'light'
                              ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                              : ''
                          } dark:text-slate-200 px-3 !py-0.5`}
                        >
                          <span className="flex tems-end">
                            <Icons.sun className="mr-2" size={18} />
                          </span>
                          <span>{t('Theme:::Light', { ns: 'navbar' })}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={() => {
                            setTheme('dark')
                          }}
                          className={`text-sm border-0 font-normal bg-slate-50 dark:bg-slate-950 ${
                            theme === 'dark'
                              ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                              : ''
                          } dark:text-slate-200 px-3 !py-0.5`}
                        >
                          <span className="flex tems-end">
                            <Icons.moon className="mr-2" size={17} />
                          </span>
                          <span>{t('Theme:::Dark', { ns: 'navbar' })}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={() => {
                            setTheme('system')
                          }}
                          className={`text-sm border-0 font-normal bg-slate-50 dark:bg-slate-950 ${
                            theme === 'system'
                              ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                              : ''
                          } dark:text-slate-200 px-3 !py-0.5`}
                        >
                          <span className="tems-end flex w-[1.5rem] ">
                            <Icons.sunmoon className="mr-2" width={14} height={14} />
                          </span>
                          <span>{t('Theme:::System', { ns: 'navbar' })}</span>
                        </Button>
                      </Flex>
                    </CardHeader>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card>
                    <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-1 mb-4">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full mb-3">
                        {t('Application UI Language', { ns: 'settings' })}
                        <Text className="text-sm text-muted-foreground mt-2">
                          {t('Change the application user interface language', {
                            ns: 'settings',
                          })}
                        </Text>
                      </CardTitle>
                      <Flex className="gap-3 flex-wrap items-start justify-start">
                        {LANGUAGES.map(
                          ({
                            code,
                            name,
                            flag,
                          }: {
                            code: string
                            name: string
                            flag: string
                          }) => (
                            <Button
                              key={code}
                              variant="ghost"
                              onClick={() => {
                                i18n.changeLanguage(code)
                              }}
                              className={`text-sm font-normal bg-slate-50 dark:bg-slate-950 ${
                                i18n.language === code
                                  ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                                  : ''
                              } dark:text-slate-200 px-3 !py-0.5`}
                            >
                              <span className="flags mr-3">{flag}</span> {name}
                            </Button>
                          )
                        )}
                      </Flex>
                    </CardHeader>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isSwapPanels && 'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Swap Panels Layout', { ns: 'common' })}
                      </CardTitle>
                      <Switch
                        checked={isSwapPanels}
                        disabled={isSinglePanelView}
                        className="ml-auto"
                        onCheckedChange={async () => {
                          setIsSwapPanels(!isSwapPanels)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'Switch the layout position of panels in Clipboard History and Paste Menu views',
                          { ns: 'settings' }
                        )}
                      </Text>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isSimplifiedLayout && 'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Simplified Panel Layout', { ns: 'settings2' })}
                      </CardTitle>
                      <Switch
                        checked={isSimplifiedLayout}
                        className="ml-auto"
                        onCheckedChange={async () => {
                          setIsSimplifiedLayout(!isSimplifiedLayout)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'Enable simplified, less boxy layout for a cleaner and more streamlined interface design',
                          { ns: 'settings2' }
                        )}
                      </Text>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="animate-in fade-in text-md font-medium">
                        {t('Panel Visibility', { ns: 'settings2' })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground mb-4">
                        {t('Control which panels are visible in the main window', {
                          ns: 'settings2',
                        })}
                      </Text>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="text-[15px] font-semibold">
                              {t('Show History Panel Only', { ns: 'settings2' })}
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                              {t('Clipboard history panel visible', { ns: 'settings2' })}
                            </Text>
                          </div>
                          <Switch
                            checked={isHistoryPanelVisibleOnly}
                            onCheckedChange={async checked => {
                              try {
                                await setIsHistoryPanelVisibleOnly(checked)
                              } catch (error) {
                                console.error(
                                  'Failed to update history panel visibility:',
                                  error
                                )
                              }
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="text-[15px] font-semibold">
                              {t('Show Boards and Clips Panel Only', { ns: 'settings2' })}
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                              {t('Boards, saved clips and menu items panel visible', {
                                ns: 'settings2',
                              })}
                            </Text>
                          </div>
                          <Switch
                            checked={isSavedClipsPanelVisibleOnly}
                            onCheckedChange={async checked => {
                              try {
                                await setIsSavedClipsPanelVisibleOnly(checked)
                              } catch (error) {
                                console.error(
                                  'Failed to update saved clips panel visibility:',
                                  error
                                )
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="text-[15px] font-semibold">
                              {t('Show Both Panels', { ns: 'settings2' })}
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                              {t(
                                'Both clipboard history and saved clips panels visible',
                                {
                                  ns: 'settings2',
                                }
                              )}
                            </Text>
                          </div>
                          <Switch
                            checked={
                              !isSavedClipsPanelVisibleOnly && !isHistoryPanelVisibleOnly
                            }
                            onCheckedChange={async checked => {
                              try {
                                await setShowBothPanels(checked)
                              } catch (error) {
                                console.error(
                                  'Failed to update saved clips panel visibility:',
                                  error
                                )
                              }
                            }}
                          />
                        </div>
                      </div>

                      {(isHistoryPanelVisibleOnly || isSavedClipsPanelVisibleOnly) && (
                        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border-l-4 border-amber-300 dark:border-amber-600">
                          <Text className="text-xs text-amber-700 dark:text-amber-300">
                            {t(
                              'Note: At least one panel must remain visible in main window.',
                              {
                                ns: 'settings2',
                              }
                            )}
                          </Text>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isShowNavBarItemsOnHoverOnly
                        ? 'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                        : ''
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Show navbar elements on hover only', { ns: 'settings2' })}
                      </CardTitle>
                      <Switch
                        checked={isShowNavBarItemsOnHoverOnly}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsShowNavBarItemsOnHoverOnly(!isShowNavBarItemsOnHoverOnly)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'Display navbar items only when the mouse hovers over the navigation bar to minimize visible UI elements',
                          {
                            ns: 'settings2',
                          }
                        )}
                      </Text>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isHideCollectionsOnNavBar &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Hide collections menu on the navbar', { ns: 'settings2' })}
                      </CardTitle>
                      <Switch
                        checked={isHideCollectionsOnNavBar}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsHideCollectionsOnNavBar(!isHideCollectionsOnNavBar)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t('Hide collections menu dropdown on the navigation bar', {
                          ns: 'settings2',
                        })}
                      </Text>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isMenuItemCopyOnlyEnabled &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Copy only from menu items', { ns: 'settings2' })}
                      </CardTitle>
                      <Switch
                        checked={isMenuItemCopyOnlyEnabled}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsMenuItemCopyOnlyEnabled(!isMenuItemCopyOnlyEnabled)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'When enabled, clicking menu items will only copy content to clipboard instead of auto-pasting. This gives you more control over when and where content is pasted.',
                          { ns: 'settings2' }
                        )}
                      </Text>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isSingleClickToCopyPaste &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Single Click Copy/Paste', { ns: 'settings2' })}
                      </CardTitle>
                      <Switch
                        checked={isSingleClickToCopyPaste}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsSingleClickToCopyPaste(!isSingleClickToCopyPaste)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'Enable single-click to copy/paste clipboard history items and saved clips instead of requiring double-click.',
                          { ns: 'settings2' }
                        )}
                      </Text>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isSingleClickKeyboardFocus &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Single-Click Keyboard Focus', { ns: 'settings2' })}{' '}
                      </CardTitle>
                      <Switch
                        checked={isSingleClickKeyboardFocus}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsSingleClickKeyboardFocus(!isSingleClickKeyboardFocus)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'Set keyboard focus with a single click. Disables single-click copy/paste if set.', // Updated Description Key
                          { ns: 'settings2' }
                        )}
                      </Text>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isShowCollectionNameOnNavBar &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Show collection name on the navbar', { ns: 'settings' })}
                      </CardTitle>
                      <Switch
                        checked={isShowCollectionNameOnNavBar}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsShowCollectionNameOnNavBar(!isShowCollectionNameOnNavBar)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'Display full name of selected collection on the navigation bar',
                          { ns: 'settings' }
                        )}
                      </Text>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isShowDisabledCollectionsOnNavBarMenu &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Show disabled collections on the navbar list', {
                          ns: 'settings',
                        })}
                      </CardTitle>
                      <Switch
                        checked={isShowDisabledCollectionsOnNavBarMenu}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsShowDisabledCollectionsOnNavBarMenu(
                            !isShowDisabledCollectionsOnNavBarMenu
                          )
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'Display disabled collections name on the navigation bar under collections menu',
                          { ns: 'settings' }
                        )}
                      </Text>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card>
                    <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full mb-3">
                        {t('Global System OS Hotkeys', { ns: 'settings2' })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground mb-4">
                        {t(
                          'Set system OS hotkeys to show/hide the main app window and quick paste window. Supports up to 3-key combinations.',
                          { ns: 'settings2' }
                        )}
                      </Text>
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Text className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                          {t('How to set hotkeys:', { ns: 'settings2' })}
                        </Text>
                        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                          <li>
                            •{' '}
                            {t('Click Set/Change button to start recording', {
                              ns: 'settings2',
                            })}
                          </li>
                          <li>
                            •{' '}
                            {t(
                              'Press your desired key combination (e.g., Ctrl+Shift+V)',
                              { ns: 'settings2' }
                            )}
                          </li>
                          <li>
                            •{' '}
                            {t('Press Enter to confirm or Escape to cancel', {
                              ns: 'settings2',
                            })}
                          </li>
                          <li>
                            •{' '}
                            {t('Press Backspace/Delete to clear the hotkey', {
                              ns: 'settings2',
                            })}
                          </li>
                        </ul>
                      </div>
                      <Box className="mb-4">
                        <div className="relative">
                          <InputField
                            label={t('Show/Hide Main App Window', { ns: 'settings2' })}
                            value={
                              isEditingMainApp
                                ? currentKeyPreview || mainAppHotkey
                                : mainAppHotkey
                            }
                            autoFocus={isEditingMainApp}
                            disabled={!isEditingMainApp}
                            onKeyDown={e =>
                              isEditingMainApp && handleKeyDown(e, setMainAppHotkey)
                            }
                            onKeyUp={handleKeyUp}
                            readOnly={!isEditingMainApp}
                            placeholder={
                              isEditingMainApp
                                ? t('Press your key combination...', { ns: 'settings2' })
                                : mainAppHotkey || t('No keys set', { ns: 'settings2' })
                            }
                            className={`${
                              isEditingMainApp
                                ? 'border-blue-300 dark:border-blue-600'
                                : ''
                            }`}
                          />
                          {isEditingMainApp && (
                            <div className="absolute right-3 top-8 text-xs text-blue-600 dark:text-blue-400">
                              {currentKeyPreview && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <span>{t('Recording...', { ns: 'settings2' })}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <Flex className="mt-2 gap-2 justify-start">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (isEditingMainApp) {
                                setHotKeysShowHideMainAppWindow(mainAppHotkey)
                                setIsEditingMainApp(false)
                                setTimeout(() => {
                                  window.location.reload()
                                }, 300)
                              } else {
                                if (isEditingQuickPaste) {
                                  setQuickPasteHotkey(hotKeysShowHideQuickPasteWindow)
                                  setIsEditingQuickPaste(false)
                                }
                                setIsEditingMainApp(true)
                              }
                            }}
                          >
                            {isEditingMainApp
                              ? t('Done', { ns: 'common' })
                              : !mainAppHotkey
                                ? t('Set', { ns: 'settings2' })
                                : t('Change', { ns: 'settings2' })}
                          </Button>
                          {isEditingMainApp && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setMainAppHotkey(hotKeysShowHideMainAppWindow)
                                setIsEditingMainApp(false)
                              }}
                            >
                              {t('Cancel', { ns: 'common' })}
                            </Button>
                          )}
                        </Flex>
                      </Box>
                      <Box>
                        <div className="relative">
                          <InputField
                            label={t('Show/Hide Quick Paste Window', { ns: 'settings2' })}
                            value={
                              isEditingQuickPaste
                                ? currentKeyPreview || quickPasteHotkey
                                : quickPasteHotkey
                            }
                            disabled={!isEditingQuickPaste}
                            autoFocus={isEditingQuickPaste}
                            onKeyDown={e =>
                              isEditingQuickPaste && handleKeyDown(e, setQuickPasteHotkey)
                            }
                            onKeyUp={handleKeyUp}
                            readOnly={!isEditingQuickPaste}
                            placeholder={
                              isEditingQuickPaste
                                ? t('Press your key combination...', { ns: 'settings2' })
                                : quickPasteHotkey ||
                                  t('No keys set', { ns: 'settings2' })
                            }
                            className={`${
                              isEditingQuickPaste
                                ? 'border-blue-300 dark:border-blue-600'
                                : ''
                            }`}
                          />
                          {isEditingQuickPaste && (
                            <div className="absolute right-3 top-8 text-xs text-blue-600 dark:text-blue-400">
                              {currentKeyPreview && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <span>{t('Recording...', { ns: 'settings2' })}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <Flex className="mt-2 gap-2 justify-start">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (isEditingQuickPaste) {
                                setHotKeysShowHideQuickPasteWindow(quickPasteHotkey)
                                setIsEditingQuickPaste(false)
                                setTimeout(() => {
                                  window.location.reload()
                                }, 300)
                              } else {
                                if (isEditingMainApp) {
                                  setMainAppHotkey(hotKeysShowHideMainAppWindow)
                                  setIsEditingMainApp(false)
                                }
                                setIsEditingQuickPaste(true)
                              }
                            }}
                          >
                            {isEditingQuickPaste
                              ? t('Done', { ns: 'common' })
                              : !quickPasteHotkey
                                ? t('Set', { ns: 'settings2' })
                                : t('Change', { ns: 'settings2' })}
                          </Button>
                          {isEditingQuickPaste && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setQuickPasteHotkey(hotKeysShowHideQuickPasteWindow)
                                setIsEditingQuickPaste(false)
                              }}
                            >
                              {t('Cancel', { ns: 'common' })}
                            </Button>
                          )}
                        </Flex>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                {isMacOSX && (
                  <Box className="animate-in fade-in max-w-xl mt-4">
                    <Card
                      className={`${
                        !isHideMacOSDockIcon &&
                        'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                      }`}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="animate-in fade-in text-md font-medium w-full flex">
                          {t('Hide the App Dock Icon', {
                            ns: 'settings2',
                          })}
                          <Badge className="ml-2" variant="pro">
                            {t('App restart required', {
                              ns: 'settings2',
                            })}
                          </Badge>
                        </CardTitle>
                        <Switch
                          checked={isHideMacOSDockIcon}
                          className="ml-auto"
                          onCheckedChange={() => {
                            setIsHideMacOSDockIcon(!isHideMacOSDockIcon)
                          }}
                        />
                      </CardHeader>
                      <CardContent>
                        <Text className="text-sm text-muted-foreground">
                          {t(
                            'Remove PasteBar app icon from the macOS Dock while keeping the app running in the background. The app remains accessible via the menu bar icon. Requires an app restart to take effect.',
                            { ns: 'settings2' }
                          )}
                        </Text>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isClipNotesHoverCardsEnabled &&
                      'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Enable Clip Title Hover Show with Delay', {
                          ns: 'settings',
                        })}
                      </CardTitle>
                      <Switch
                        checked={isClipNotesHoverCardsEnabled}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsClipNotesHoverCardsEnabled(!isClipNotesHoverCardsEnabled)
                        }}
                      />
                    </CardHeader>

                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'This option lets you control the display and timing of hover notes on clips. You can choose to show notes instantly or with a delay to prevent unintended popups.',
                          {
                            ns: 'settings',
                          }
                        )}
                      </Text>
                      <Flex className="gap-2 flex-wrap items-start justify-start mt-4 mb-4">
                        {clipNotesDelays.map((delay, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            disabled={!isClipNotesHoverCardsEnabled}
                            onClick={() => {
                              setClipNotesHoverCardsDelayMS(delay)
                            }}
                            className={`text-sm font-normal bg-slate-50 dark:bg-slate-950 ${
                              clipNotesHoverCardsDelayMS === delay
                                ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                                : ''
                            } dark:text-slate-200 px-2 !py-0.5`}
                          >
                            {convertMsToSeconds(delay)}
                          </Button>
                        ))}
                      </Flex>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={
                          clipNotesHoverCardsDelayMS === 2000 ||
                          !isClipNotesHoverCardsEnabled
                        }
                        onClick={() => {
                          setClipNotesHoverCardsDelayMS(2000)
                        }}
                        className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200 mt-1"
                      >
                        {t('Reset', { ns: 'common' })}
                      </Button>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="max-w-xl mt-4 animate-in fade-in">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Clip Notes Popup Maximum Dimensions', {
                          ns: 'settings',
                        })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'This option lets you customize the maximum width and height of the popup that displays clip notes, ensuring it fits comfortably within your desired size.',
                          {
                            ns: 'settings',
                          }
                        )}
                      </Text>

                      <ToolTipNotes
                        text={md}
                        side="top"
                        isDark={isDark}
                        delayDuration={clipNotesHoverCardsDelayMS}
                        classNameTrigger="inline-flex items-start"
                        sideOffset={0}
                        maxWidth={clipNotesMaxWidth}
                        maxHeight={clipNotesMaxHeight}
                        asChild
                      >
                        <Text className="text-sm text-muted-foreground mt-3 underline cursor-pointer">
                          {t('Preview current popup size on hover.', {
                            ns: 'settings',
                          })}
                        </Text>
                      </ToolTipNotes>
                      <Flex className="gap-2 flex-wrap items-start justify-start mt-4 mb-4">
                        {clipNotesSizes.map((size, index) => {
                          const isSelected =
                            size.width === clipNotesMaxWidth &&
                            size.height === clipNotesMaxHeight

                          return (
                            <Button
                              key={index}
                              variant="ghost"
                              onClick={() => {
                                setClipNotesMaxWidth(size.width)
                                setClipNotesMaxHeight(size.height)
                              }}
                              className={`text-sm font-normal bg-slate-50 dark:bg-slate-950 ${
                                isSelected
                                  ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                                  : ''
                              } dark:text-slate-200 px-4 !py-0.5`}
                            >
                              {size.iconSize && (
                                <MessageSquare size={size.iconSize} className="mr-2" />
                              )}
                              {t(size.title, { ns: 'settings' })}
                            </Button>
                          )
                        })}

                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (
                              !clipNotesSizes.some(
                                size =>
                                  size.width === clipNotesMaxWidth &&
                                  size.height === clipNotesMaxHeight
                              )
                            ) {
                              return
                            }
                            setClipNotesMaxWidth(440)
                            setClipNotesMaxHeight(240)
                          }}
                          className={`text-sm font-normal bg-slate-50 dark:bg-slate-950 ${
                            !clipNotesSizes.some(
                              size =>
                                size.width === clipNotesMaxWidth &&
                                size.height === clipNotesMaxHeight
                            )
                              ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                              : ''
                          } dark:text-slate-200 px-4 !py-0.5`}
                        >
                          <MessageSquareDashed size={21} className="mr-2" />
                          {t('Custom', { ns: 'settings' })}
                        </Button>
                      </Flex>
                      <Flex className="w-full gap-10 my-4 items-start justify-start">
                        <InputField
                          className="text-md !w-36"
                          type="number"
                          step="20"
                          max={800}
                          min={100}
                          small
                          label={t('Maximum width', { ns: 'common' })}
                          value={clipNotesMaxWidth}
                          onBlur={() => {
                            if (clipNotesMaxWidth < 100) {
                              setClipNotesMaxWidth(100)
                            } else if (clipNotesMaxWidth > 800) {
                              setClipNotesMaxWidth(800)
                            }
                          }}
                          onChange={e => {
                            const value = e.target.value
                            if (value === '') {
                              return
                            } else {
                              const number = parseInt(value)
                              if (number) {
                                setClipNotesMaxWidth(number)
                              }
                            }
                          }}
                        />
                        <InputField
                          className="text-md !w-36"
                          type="number"
                          step="20"
                          max={600}
                          min={100}
                          small
                          label={t('Maximum height', { ns: 'common' })}
                          value={clipNotesMaxHeight}
                          onBlur={() => {
                            if (clipNotesMaxHeight < 100) {
                              setClipNotesMaxHeight(100)
                            } else if (clipNotesMaxHeight > 600) {
                              setClipNotesMaxHeight(600)
                            }
                          }}
                          onChange={e => {
                            const value = e.target.value
                            if (value === '') {
                              return
                            } else {
                              const number = parseInt(value)
                              if (number) {
                                setClipNotesMaxHeight(number)
                              }
                            }
                          }}
                        />
                      </Flex>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={clipNotesMaxWidth === 220 && clipNotesMaxHeight === 120}
                        onClick={() => {
                          setClipNotesMaxWidth(220)
                          setClipNotesMaxHeight(120)
                        }}
                        className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200 mt-1"
                      >
                        {t('Reset', { ns: 'common' })}
                      </Button>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="animate-in fade-in text-md font-medium">
                        {t('Quick Paste Window Options', { ns: 'settings2' })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground mb-4">
                        {t(
                          'Configure the behavior of the Quick Paste window when selecting items',
                          {
                            ns: 'settings2',
                          }
                        )}
                      </Text>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="text-[15px] font-semibold">
                              {t('Copy items only (no auto-paste)', { ns: 'settings2' })}
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                              {t(
                                'When enabled, clicking or pressing Enter on items in Quick Paste window will only copy them to clipboard without automatically pasting.',
                                { ns: 'settings2' }
                              )}
                            </Text>
                          </div>
                          <Switch
                            checked={isQuickPasteCopyOnly}
                            onCheckedChange={async checked => {
                              try {
                                await setIsQuickPasteCopyOnly(checked)
                              } catch (error) {
                                console.error(
                                  'Failed to update quick paste copy only setting:',
                                  error
                                )
                              }
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="text-[15px] font-semibold">
                              {t('Single Click Copy/Paste action', { ns: 'settings2' })}
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                              {t(
                                'When enabled, single click will copy/paste items in Quick Paste window. If global single click is also enabled, both settings work together.',
                                { ns: 'settings2' }
                              )}
                            </Text>
                          </div>
                          <Switch
                            checked={isSingleClickToCopyPasteQuickWindow}
                            onCheckedChange={async checked => {
                              try {
                                await setIsSingleClickToCopyPasteQuickWindow(checked)
                              } catch (error) {
                                console.error(
                                  'Failed to update quick window single click setting:',
                                  error
                                )
                              }
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="text-[15px] font-semibold">
                              {t('Auto-close window after action', { ns: 'settings2' })}
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                              {t(
                                'When enabled, the Quick Paste window will automatically close after copying or pasting an item.',
                                { ns: 'settings2' }
                              )}
                            </Text>
                          </div>
                          <Switch
                            checked={isQuickPasteAutoClose}
                            onCheckedChange={async checked => {
                              try {
                                await setIsQuickPasteAutoClose(checked)
                              } catch (error) {
                                console.error(
                                  'Failed to update quick paste auto close setting:',
                                  error
                                )
                              }
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="animate-in fade-in max-w-xl mt-4">
                  <Card
                    className={`${
                      !isNoteIconsEnabled && 'opacity-80 bg-gray-100 dark:bg-gray-900/80'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                      <CardTitle className="animate-in fade-in text-md font-medium w-full">
                        {t('Show Note Icons on Clips', { ns: 'settings2' })}
                      </CardTitle>
                      <Switch
                        checked={isNoteIconsEnabled}
                        className="ml-auto"
                        onCheckedChange={() => {
                          setIsNoteIconsEnabled(!isNoteIconsEnabled)
                        }}
                      />
                    </CardHeader>
                    <CardContent>
                      <Text className="text-sm text-muted-foreground">
                        {t(
                          'Display persistent icons on clips that have notes to improve visual organization and make notes easier to discover.',
                          { ns: 'settings2' }
                        )}
                      </Text>

                      {isNoteIconsEnabled && (
                        <Box className="mt-4">
                          <Text className="text-sm font-medium mb-2 flex items-center gap-2">
                            {t('Default Note Icon Type', { ns: 'settings2' })}
                            <span className="text-gray-500 flex items-center gap-1">
                              {(() => {
                                const iconMap = {
                                  MessageSquareText: MessageSquareText,
                                  FileText: FileText,
                                  BookOpenText: BookOpenText,
                                  Contact: Contact,
                                  NotebookPen: NotebookPen,
                                }
                                const IconComponent =
                                  iconMap[defaultNoteIconType as keyof typeof iconMap] ||
                                  MessageSquareText
                                return (
                                  <IconComponent
                                    size={16}
                                    className="text-gray-600 dark:text-gray-400"
                                  />
                                )
                              })()}
                            </span>
                          </Text>
                          <Flex className="gap-2 flex-wrap justify-start">
                            {[
                              {
                                value: 'MessageSquareText',
                                labelKey: 'Note Icon Types Message',
                                icon: MessageSquareText,
                              },
                              {
                                value: 'FileText',
                                labelKey: 'Note Icon Types File',
                                icon: FileText,
                              },
                              {
                                value: 'BookOpenText',
                                labelKey: 'Note Icon Types Book',
                                icon: BookOpenText,
                              },
                              {
                                value: 'Contact',
                                labelKey: 'Note Icon Types Contact',
                                icon: Contact,
                              },
                              {
                                value: 'NotebookPen',
                                labelKey: 'Note Icon Types Notebook',
                                icon: NotebookPen,
                              },
                            ].map(option => (
                              <Button
                                key={option.value}
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDefaultNoteIconType(option.value as NoteIconType)
                                }}
                                className={`text-sm font-normal bg-slate-50 dark:bg-slate-950 ${
                                  defaultNoteIconType === option.value
                                    ? 'bg-slate-300 font-semibold dark:bg-slate-600 text-dark dark:text-slate-200 hover:dark:bg-slate-600 hover:bg-slate-300'
                                    : ''
                                } dark:text-slate-200 px-3 py-1.5 flex items-center gap-2`}
                              >
                                <option.icon size={16} />
                                {t(option.labelKey, { ns: 'contextMenus' })}
                              </Button>
                            ))}
                          </Flex>
                          <Text className="text-xs text-muted-foreground mt-2">
                            {t(
                              'This sets the default icon type for new clips with notes. You can customize individual clips via the context menu.',
                              { ns: 'settings2' }
                            )}
                          </Text>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
                <GlobalTemplatesSettings />
                <Spacer h={6} />
                <Link to={returnRoute} replace>
                  <Button
                    variant="ghost"
                    className="text-sm bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                    size="sm"
                  >
                    {t('Back', { ns: 'common' })}
                  </Button>
                </Link>
                <Spacer h={4} />
              </SimpleBar>
            </Box>
          )
        )
      }}
    </AutoSize>
  )
}
