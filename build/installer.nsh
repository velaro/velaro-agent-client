!macro customUnInstall
    SetRegView 64
        DeleteRegKey HKCU "SOFTWARE\Classes\velaro-lc"
    SetRegView 32
        DeleteRegKey HKCU "SOFTWARE\Classes\velaro-lc"
 !macroend
