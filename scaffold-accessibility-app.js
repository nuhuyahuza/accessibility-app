const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'accessibility-app');
const folders = [
  'app',
  'app/batch-scanner',
  'assets',
  'components',
  'constants',
  'context',
  'services',
  'utils',
];

const appScreens = [
  'index.tsx',
  'camera.tsx',
  'processing.tsx',
  'text-review.tsx',
  'saved-scans.tsx',
  'batch-scanner.tsx',
  'onboarding.tsx',
  'settings.tsx',
  'auto-capture.tsx',
  'object-detection.tsx',
  'summarize.tsx',
  '_layout.tsx'
];

const exampleFiles = {
  '.env.example': `GOOGLE_VISION_API_KEY=your_google_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
DEFAULT_LANG=en-US`,
  'babel.config.js': `
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['module:react-native-dotenv']],
  };
};
  `,
  'app.config.ts': `
export default {
  name: "AccessibilityApp",
  slug: "accessibility-app",
  version: "1.0.0",
  sdkVersion: "50.0.0",
  extra: {
    eas: {
      projectId: "your-eas-project-id"
    }
  }
};
  `,
  'tsconfig.json': `
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  }
}
  `,
  'package.json': `
{
  "name": "accessibility-app",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "expo start"
  },
  "dependencies": {},
  "devDependencies": {}
}
  `,
  'app/_layout.tsx': `
import { Stack } from 'expo-router';
export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
  `,
  'app/index.tsx': `
import { View, Text } from 'react-native';
import AccessibleButton from '../components/AccessibleButton';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to the Accessibility App</Text>
      <AccessibleButton label="Start Scanning" onPress={() => router.push('/camera')} />
    </View>
  );
}
  `,
  'components/AccessibleButton.tsx': `
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
}

const AccessibleButton: React.FC<Props> = ({ label, onPress }) => (
  <TouchableOpacity
    accessible
    accessibilityLabel={label}
    accessibilityRole="button"
    style={styles.button}
    onPress={onPress}
  >
    <Text style={styles.text}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#003B73',
    padding: 20,
    borderRadius: 10,
    margin: 10,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
  },
});

export default AccessibleButton;
  `
};

// Step 1: Create folders
folders.forEach(folder => {
  const dir = path.join(base, folder);
  fs.mkdirSync(dir, { recursive: true });
});

// Step 2: Create screen files
appScreens.forEach(screen => {
  const file = path.join(base, 'app', screen);
  fs.writeFileSync(file, `// TODO: implement ${screen}`);
});

// Step 3: Write example files
Object.entries(exampleFiles).forEach(([relPath, content]) => {
  const filePath = path.join(base, relPath);
  fs.writeFileSync(filePath, content.trim());
});

console.log(`✅ Project scaffolded in: ${base}`);
