import { jest } from '@jest/globals';

global.beforeAll = jest.fn();
global.afterAll = jest.fn();
global.beforeEach = jest.fn();
global.afterEach = jest.fn();
global.describe = jest.fn();
global.it = jest.fn();
global.expect = jest.expect;