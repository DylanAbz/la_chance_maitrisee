# TP de la Chance Maîtrisée

## Objectif
Ce projet consiste à créer un jeu web multijoueur basé sur un système de pari "Pile ou Face". Le jeu utilise les **WebSockets** pour permettre la communication en temps réel entre les joueurs et le serveur. L'objectif est de permettre aux joueurs de s'affronter en pariant des points sur le résultat d'un lancer de pièce.

## Fonctionnalités principales
- Les joueurs parient sur "Pile" ou "Face".
- Les joueurs doivent saisir leur pseudo à l'arrivée.
- Un chat est disponible pour discuter entre les joueurs avant et pendant le jeu.
- Le jeu démarre automatiquement quand **3 joueurs** sont connectés.
- Chaque joueur dispose d'un capital de 100 points pour démarrer.
- Le jeu se déroule en **3 manches**.
- Le joueur avec le plus de points à la fin des manches gagne.
- Un classement final des joueurs est affiché.
- Bonus : Si un **4e joueur** se connecte après le début du jeu, il est informé qu'il est arrivé trop tard.

## Prérequis

### Côté serveur
1. **Node.js** et **npm** installés sur la machine.
2. Gérer la problématique des **CORS** pour autoriser les connexions depuis n'importe quelle origine.

### Notions abordées
- Utilisation de **WebSockets** avec **Socket.IO**.
- Création d'un serveur web avec **Express**.
- Interactions client-serveur avec **Socket.IO** pour la communication en temps réel.

## Instructions d'installation

1. Clonez ce dépôt sur votre machine :
   ```bash
   git clone https://github.com/username/tp-chance-maitrisee.git
   cd tp-chance-maitrisee
   ```
2. Lancez le serveur :
   ```bash
   npm run serv
   ```

3. Lancez les clients :
   ```bash
   npx serve . -p 63342
   ```
