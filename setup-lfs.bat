@echo off
echo ===== Configuration Git LFS pour l'APK =====
echo.

:: Vérifier si git lfs est installé
git lfs version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Git LFS n'est pas installe!
    echo Telecharge-le depuis: https://git-lfs.github.com/
    echo.
    pause
    exit /b 1
)

:: Initialiser Git LFS
echo 1. Initialisation de Git LFS...
git lfs install

:: Tracker les fichiers APK
echo 2. Configuration du tracking pour les APK...
git lfs track "downloads/*.apk"

:: Vérifier si .gitattributes existe
if not exist .gitattributes (
    echo ERREUR: Le fichier .gitattributes n'a pas ete cree!
    pause
    exit /b 1
)

:: Ajouter les fichiers
echo 3. Ajout des fichiers...
git add .gitattributes

:: Deplacer l'APK s'il est a la racine
if exist android-epointage.apk (
    echo 4. Deplacement de l'APK vers downloads/...
    if not exist downloads mkdir downloads
    move android-epointage.apk downloads\
)

:: Ajouter l'APK
git add downloads/android-epointage.apk

:: Commit
echo 5. Commit...
git commit -m "Ajout APK via Git LFS"

:: Push
echo 6. Push vers GitHub...
git push

echo.
echo ===== TERMINE =====
echo.
pause
