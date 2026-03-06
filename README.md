# @ton-org/logger

Un logger structuré et typé pour Node.js/Next.js/Fastify, avec sortie JSON propre en production et rendu lisible en développement.

## Vision

Ce logger combine les meilleures pratiques de :
- **Pino** : logs JSON structurés, performance, niveaux numériques
- **Winston** : transports multiples (destinations)
- **Signale** : scopes, sortie colorée avec icônes en développement

## Installation

```bash
npm install @ton-org/logger
```

## Quick Start

```typescript
import { createLogger, createConsoleDestination } from '@ton-org/logger';

const logger = createLogger({
  level: 'info',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  service: 'billing-api',
  environment: process.env.NODE_ENV,
  destinations: [createConsoleDestination()],
});

logger.info('Server started', { port: 3000 });
logger.error(new Error('Payment failed'), 'Transaction error', { userId: 'u_123' });
```

## Caractéristiques

### Logs structurés JSON

Chaque log produit un record JSON avec un schéma stable :

```json
{
  "timestamp": "2024-01-15T12:00:00.000Z",
  "level": "info",
  "msg": "Server started",
  "context": { "port": 3000 },
  "service": "billing-api",
  "environment": "production"
}
```

### Niveaux de logs

Six niveaux disponibles (+ `silent` pour désactiver) :
- `trace` (10)
- `debug` (20)
- `info` (30) - niveau par défaut
- `warn` (40)
- `error` (50)
- `fatal` (60)

Les logs inférieurs au niveau configuré sont automatiquement filtrés pour optimiser les performances.

### Child Loggers

Créez des loggers enfants avec du contexte hérité :

```typescript
const requestLogger = logger.child({ requestId: 'req_abc123' });
requestLogger.info('Processing request');
// Inclut automatiquement requestId dans tous les logs
```

### Scopes

Organisez vos logs par module ou fonctionnalité :

```typescript
const billingLogger = logger.scope('billing', 'stripe');
billingLogger.info('Payment processed');
// Output: { ..., "scope": ["billing", "stripe"] }
```

### Gestion des erreurs

Sérialisez automatiquement les objets Error :

```typescript
try {
  await processPayment();
} catch (error) {
  logger.error(error, 'Payment failed', { userId: 'u_123' });
}
```

Produit :

```json
{
  "timestamp": "...",
  "level": "error",
  "msg": "Payment failed",
  "context": { "userId": "u_123" },
  "error": {
    "name": "Error",
    "message": "Original error message",
    "stack": "..."
  }
}
```

### Redaction des données sensibles

Protégez les données sensibles avec un hook de redaction :

```typescript
const logger = createLogger({
  redact: (record) => ({
    ...record,
    context: record.context
      ? redactSensitiveFields(record.context, ['password', 'token', 'cardNumber'])
      : undefined,
  }),
});
```

## API

### `createLogger(config?: LoggerConfig): Logger`

Crée une instance de logger.

**Options de configuration :**

```typescript
interface LoggerConfig {
  level?: LogLevel;                          // Niveau minimum des logs (défaut: 'info')
  mode?: 'production' | 'development';       // Mode d'affichage (défaut: 'production')
  service?: string;                          // Nom du service
  environment?: string;                      // Environnement (dev/staging/prod)
  defaultContext?: Record<string, unknown>;  // Contexte par défaut
  destinations?: Destination[];              // Destinations de logs
  redact?: (record) => record;              // Hook de redaction
  timeProvider?: () => string;               // Provider de timestamp (pour tests)
}
```

### Méthodes du Logger

```typescript
logger.trace(msg: string, context?: object): void
logger.debug(msg: string, context?: object): void
logger.info(msg: string, context?: object): void
logger.warn(msg: string, context?: object): void
logger.error(msg: string, context?: object): void
logger.fatal(msg: string, context?: object): void

// Avec Error comme premier argument
logger.error(error: Error, msg?: string, context?: object): void

// Child logger
logger.child(context: object): Logger

// Scoped logger
logger.scope(...names: string[]): Logger

// Clone avec niveau différent
logger.withLevel(level: LogLevel): Logger
```

## Destinations

### Console Destination

Écrit sur stdout (info/debug/trace) et stderr (error/fatal) :

```typescript
import { createConsoleDestination } from '@ton-org/logger';

const logger = createLogger({
  destinations: [createConsoleDestination()],
});
```

### Custom Destination

Créez vos propres destinations :

```typescript
interface Destination {
  write: (record: LogRecord) => void | Promise<void>;
  flush?: () => Promise<void>;
}

const customDestination: Destination = {
  write: async (record) => {
    await sendToElasticsearch(record);
  },
};
```

## Examples

Voir le dossier `examples/` pour des cas d'usage complets :
- `examples/basic.ts` - Utilisation basique

## Développement

```bash
# Installation des dépendances
npm install

# Build
npm run build

# Tests
npm test

# Tests en mode watch
npm run dev

# Type checking
npm run typecheck
```

## Roadmap

### Étape 1 - Core minimal ✅
- Mapping des niveaux
- LogRecord de base
- createLogger avec tous les niveaux
- Console destination

### Étape 2 - API complète (en cours)
- Sérialisation d'erreur ✅
- Child loggers ✅
- Scopes ✅
- Redaction hook ✅

### Étape 3 - Destinations multiples
- File destination
- Support de plusieurs destinations simultanées

### Étape 4 - Mode développement
- Pretty destination avec couleurs
- Icônes par niveau
- Format lisible

### Étape 5 - Polish
- Utilitaires de redaction
- Benchmarks de performance

### Étape 6 - Documentation et examples
- Examples Next.js, Fastify
- Guide d'intégration
- CI/CD

## License

MIT
