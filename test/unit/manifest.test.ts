import { expect, test } from 'bun:test';
import { createManifest } from '../../manifest.config';

const manifest = createManifest();

test('is an object', () => {
  expect(manifest).toBeTypeOf('object');
  expect(manifest).not.toBeArray();
});

test('is valid JSON', () => {
  const result = JSON.parse(JSON.stringify(manifest)) as typeof manifest;
  expect(result).toEqual(manifest);
});

test('contains expected properties', () => {
  expect(manifest.manifest_version).toBeDefined();
  expect(manifest.name).toBeDefined();
  expect(manifest.description).toBeDefined();
  expect(manifest.homepage_url).toBeDefined();
  expect(manifest.version).toBeDefined();
  expect(manifest.icons).toBeDefined();
  expect(manifest.icons?.[16]).toBeDefined();
  expect(manifest.icons?.[48]).toBeDefined();
  expect(manifest.icons?.[128]).toBeDefined();
  expect(manifest.permissions).toBeDefined();
  expect(manifest.action).toBeDefined();
  expect(manifest.action?.default_popup).toBeDefined();
  expect(manifest.offline_enabled).toBeDefined();
  expect(manifest.content_security_policy).toBeDefined();
  expect(manifest.content_security_policy?.extension_pages).toBeDefined();
  expect(manifest.key).toBeDefined();
});

test('properties are the correct type', () => {
  expect(manifest.manifest_version).toBeTypeOf('number');
  expect(manifest.name).toBeTypeOf('string');
  expect(manifest.description).toBeTypeOf('string');
  expect(manifest.homepage_url).toBeTypeOf('string');
  expect(manifest.version).toBeTypeOf('string');
  expect(manifest.icons).toBeTypeOf('object');
  expect(manifest.icons?.[16]).toBeTypeOf('string');
  expect(manifest.icons?.[48]).toBeTypeOf('string');
  expect(manifest.icons?.[128]).toBeTypeOf('string');
  expect(manifest.permissions).toBeArray();
  expect(manifest.action).toBeTypeOf('object');
  expect(manifest.action?.default_popup).toBeTypeOf('string');
  expect(manifest.offline_enabled).toBeTypeOf('boolean');
  expect(manifest.content_security_policy).toBeTypeOf('object');
  expect(manifest.content_security_policy?.extension_pages).toBeTypeOf('string');
  expect(manifest.key).toBeTypeOf('string');
});

test('does not contain any unexpected properties', () => {
  const expectedProperties = [
    'manifest_version',
    'name',
    'description',
    'homepage_url',
    'version',
    'version_name',
    'icons',
    'permissions',
    'action',
    'offline_enabled',
    'content_security_policy',
    'key',
  ];
  // eslint-disable-next-line guard-for-in
  for (const property in manifest) {
    expect(expectedProperties).toContain(property);
  }
  expect(Object.keys(manifest)).toHaveLength(expectedProperties.length);
});

test('manifest version is v3', () => {
  expect(manifest.manifest_version).toBe(3);
});

test('permissions contains expected values', () => {
  expect(manifest.permissions).toContain('activeTab');
  expect(manifest.permissions).toContain('scripting');
  expect(manifest.permissions).toContain('storage');
  expect(manifest.permissions).toHaveLength(3);
});

test('has correct icons.* values', () => {
  expect(manifest.icons?.[16]).toBe('icon16.png');
  expect(manifest.icons?.[48]).toBe('icon48.png');
  expect(manifest.icons?.[128]).toBe('icon128.png');
});

test('has correct action.default_popup value of "reader.html"', () => {
  expect(manifest.action?.default_popup).toBe('reader.html');
});

test('has version_name when debug option is true', () => {
  const manifest2 = createManifest(true);
  expect(manifest2.version_name).toBeDefined();
});

test('does not have version_name when when debug option is false', () => {
  const manifest2 = createManifest(false);
  expect(manifest2.version_name).toBeUndefined();
});

// HACK: Mutating env vars that were set before the process started doesn't
// work in bun, so we skip tests which rely on the CI env var _not_ being set.
test.skipIf(!!process.env.CI)('has version_name when CI env var is not set', () => {
  const manifest2 = createManifest();
  expect(manifest2.version_name).toBeDefined();
});

const oldCI = process.env.CI;
const restoreCI = () => {
  if (oldCI === undefined) {
    // TODO: Consider setting to undefined instead. Delete does not currently
    // work in bun for env vars that were set before the process started.
    //  ↳ https://github.com/oven-sh/bun/issues/1559#issuecomment-1440507885
    delete process.env.CI;
  } else {
    process.env.CI = oldCI;
  }
};

test('does not have version_name when env var CI=true', () => {
  process.env.CI = 'true';
  const manifest2 = createManifest();
  expect(manifest2.version_name).toBeUndefined();
  restoreCI();
});
