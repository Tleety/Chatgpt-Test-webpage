/**
 * Unit tests for TodoList Logic
 */

const TodoListLogic = require('../todo-list-logic');

// Mock localStorage for testing
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

// Replace localStorage with mock
Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
});

describe('TodoListLogic', () => {
    let todoList;

    beforeEach(() => {
        // Clear localStorage mock before each test
        localStorageMock.clear();
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
        
        todoList = new TodoListLogic();
    });

    describe('Initialization', () => {
        test('should initialize with empty tasks array', () => {
            expect(todoList.tasks).toEqual([]);
            expect(todoList.nextId).toBeGreaterThan(0);
        });

        test('should load tasks from localStorage when available', () => {
            const savedTasks = [
                { id: 1, text: 'Test task', completed: false }
            ];
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedTasks));
            
            const loadedTasks = todoList.loadTasks();
            expect(loadedTasks).toEqual(savedTasks);
            expect(localStorageMock.getItem).toHaveBeenCalledWith('todoTasks');
        });

        test('should return empty array when no saved tasks exist', () => {
            localStorageMock.getItem.mockReturnValue(null);
            
            const loadedTasks = todoList.loadTasks();
            expect(loadedTasks).toEqual([]);
        });

        test('should initialize with tasks from storage', () => {
            const savedTasks = [
                { id: 1, text: 'Existing task', completed: true }
            ];
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedTasks));
            
            todoList.initialize();
            expect(todoList.tasks).toEqual(savedTasks);
        });
    });

    describe('Adding Tasks', () => {
        test('should add a valid task', () => {
            const result = todoList.addTask('New task');
            
            expect(result).toBe(true);
            expect(todoList.tasks).toHaveLength(1);
            expect(todoList.tasks[0]).toMatchObject({
                text: 'New task',
                completed: false
            });
            expect(todoList.tasks[0].id).toBeGreaterThan(0);
        });

        test('should trim whitespace from task text', () => {
            todoList.addTask('  Spaced task  ');
            
            expect(todoList.tasks[0].text).toBe('Spaced task');
        });

        test('should not add empty tasks', () => {
            expect(todoList.addTask('')).toBe(false);
            expect(todoList.addTask('   ')).toBe(false);
            expect(todoList.addTask(null)).toBe(false);
            expect(todoList.addTask(undefined)).toBe(false);
            expect(todoList.tasks).toHaveLength(0);
        });

        test('should assign unique IDs to tasks', () => {
            todoList.addTask('Task 1');
            todoList.addTask('Task 2');
            
            expect(todoList.tasks[0].id).not.toBe(todoList.tasks[1].id);
            expect(todoList.tasks[1].id).toBeGreaterThan(todoList.tasks[0].id);
        });

        test('should save tasks to localStorage after adding', () => {
            todoList.addTask('Test task');
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'todoTasks',
                JSON.stringify(todoList.tasks)
            );
        });
    });

    describe('Toggling Tasks', () => {
        beforeEach(() => {
            todoList.addTask('Test task');
        });

        test('should toggle task completion status', () => {
            const taskId = todoList.tasks[0].id;
            
            expect(todoList.tasks[0].completed).toBe(false);
            
            const result = todoList.toggleTask(taskId);
            expect(result).toBe(true);
            expect(todoList.tasks[0].completed).toBe(true);
            
            todoList.toggleTask(taskId);
            expect(todoList.tasks[0].completed).toBe(false);
        });

        test('should return false for non-existent task ID', () => {
            const result = todoList.toggleTask(99999);
            expect(result).toBe(false);
        });

        test('should save tasks to localStorage after toggling', () => {
            const taskId = todoList.tasks[0].id;
            localStorageMock.setItem.mockClear();
            
            todoList.toggleTask(taskId);
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'todoTasks',
                JSON.stringify(todoList.tasks)
            );
        });
    });

    describe('Deleting Tasks', () => {
        beforeEach(() => {
            todoList.addTask('Task 1');
            todoList.addTask('Task 2');
        });

        test('should delete existing task', () => {
            const taskId = todoList.tasks[0].id;
            
            const result = todoList.deleteTask(taskId);
            expect(result).toBe(true);
            expect(todoList.tasks).toHaveLength(1);
            expect(todoList.tasks[0].text).toBe('Task 2');
        });

        test('should return false for non-existent task ID', () => {
            const result = todoList.deleteTask(99999);
            expect(result).toBe(false);
            expect(todoList.tasks).toHaveLength(2);
        });

        test('should save tasks to localStorage after deleting', () => {
            const taskId = todoList.tasks[0].id;
            localStorageMock.setItem.mockClear();
            
            todoList.deleteTask(taskId);
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'todoTasks',
                JSON.stringify(todoList.tasks)
            );
        });
    });

    describe('Task Retrieval', () => {
        beforeEach(() => {
            todoList.addTask('Completed task');
            todoList.addTask('Pending task 1');
            todoList.addTask('Pending task 2');
            todoList.toggleTask(todoList.tasks[0].id); // Mark first task as completed
        });

        test('should return all tasks', () => {
            const allTasks = todoList.getAllTasks();
            expect(allTasks).toHaveLength(3);
            expect(allTasks).not.toBe(todoList.tasks); // Should return a copy
        });

        test('should return completed tasks only', () => {
            const completedTasks = todoList.getCompletedTasks();
            expect(completedTasks).toHaveLength(1);
            expect(completedTasks[0].text).toBe('Completed task');
            expect(completedTasks[0].completed).toBe(true);
        });

        test('should return pending tasks only', () => {
            const pendingTasks = todoList.getPendingTasks();
            expect(pendingTasks).toHaveLength(2);
            expect(pendingTasks.every(task => !task.completed)).toBe(true);
        });

        test('should find task by ID', () => {
            const taskId = todoList.tasks[1].id;
            const task = todoList.getTaskById(taskId);
            
            expect(task).toMatchObject({
                id: taskId,
                text: 'Pending task 1',
                completed: false
            });
        });

        test('should return null for non-existent task ID', () => {
            const task = todoList.getTaskById(99999);
            expect(task).toBeNull();
        });
    });

    describe('Task Statistics', () => {
        test('should return correct stats for empty list', () => {
            const stats = todoList.getTaskStats();
            expect(stats).toEqual({
                total: 0,
                completed: 0,
                pending: 0
            });
        });

        test('should return correct stats with mixed tasks', () => {
            todoList.addTask('Task 1');
            todoList.addTask('Task 2');
            todoList.addTask('Task 3');
            todoList.toggleTask(todoList.tasks[0].id);
            todoList.toggleTask(todoList.tasks[1].id);
            
            const stats = todoList.getTaskStats();
            expect(stats).toEqual({
                total: 3,
                completed: 2,
                pending: 1
            });
        });
    });

    describe('Updating Tasks', () => {
        beforeEach(() => {
            todoList.addTask('Original text');
        });

        test('should update task text', () => {
            const taskId = todoList.tasks[0].id;
            
            const result = todoList.updateTask(taskId, 'Updated text');
            expect(result).toBe(true);
            expect(todoList.tasks[0].text).toBe('Updated text');
        });

        test('should trim whitespace when updating', () => {
            const taskId = todoList.tasks[0].id;
            
            todoList.updateTask(taskId, '  Updated with spaces  ');
            expect(todoList.tasks[0].text).toBe('Updated with spaces');
        });

        test('should not update with empty text', () => {
            const taskId = todoList.tasks[0].id;
            const originalText = todoList.tasks[0].text;
            
            expect(todoList.updateTask(taskId, '')).toBe(false);
            expect(todoList.updateTask(taskId, '   ')).toBe(false);
            expect(todoList.tasks[0].text).toBe(originalText);
        });

        test('should return false for non-existent task ID', () => {
            const result = todoList.updateTask(99999, 'New text');
            expect(result).toBe(false);
        });

        test('should save tasks to localStorage after updating', () => {
            const taskId = todoList.tasks[0].id;
            localStorageMock.setItem.mockClear();
            
            todoList.updateTask(taskId, 'Updated text');
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'todoTasks',
                JSON.stringify(todoList.tasks)
            );
        });
    });

    describe('Clearing Tasks', () => {
        beforeEach(() => {
            todoList.addTask('Task 1');
            todoList.addTask('Task 2');
            todoList.addTask('Task 3');
            todoList.toggleTask(todoList.tasks[0].id);
            todoList.toggleTask(todoList.tasks[1].id);
        });

        test('should clear all tasks', () => {
            todoList.clearAllTasks();
            expect(todoList.tasks).toHaveLength(0);
        });

        test('should clear completed tasks only', () => {
            const cleared = todoList.clearCompletedTasks();
            
            expect(cleared).toBe(2);
            expect(todoList.tasks).toHaveLength(1);
            expect(todoList.tasks[0].completed).toBe(false);
        });

        test('should return 0 when no completed tasks to clear', () => {
            // First clear all completed tasks
            todoList.clearCompletedTasks();
            
            // Try to clear again
            const cleared = todoList.clearCompletedTasks();
            expect(cleared).toBe(0);
        });

        test('should save tasks to localStorage after clearing', () => {
            localStorageMock.setItem.mockClear();
            
            todoList.clearAllTasks();
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'todoTasks',
                JSON.stringify([])
            );
        });
    });

    describe('HTML Escaping', () => {
        test('should escape HTML characters', () => {
            expect(TodoListLogic.escapeHtml('<script>alert("xss")</script>'))
                .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
            
            expect(TodoListLogic.escapeHtml('Tom & Jerry'))
                .toBe('Tom &amp; Jerry');
            
            expect(TodoListLogic.escapeHtml("It's a test"))
                .toBe('It&#x27;s a test');
        });

        test('should handle empty and normal text', () => {
            expect(TodoListLogic.escapeHtml('')).toBe('');
            expect(TodoListLogic.escapeHtml('Normal text')).toBe('Normal text');
        });
    });

    describe('Edge Cases', () => {
        test('should handle operations on empty task list', () => {
            expect(todoList.toggleTask(1)).toBe(false);
            expect(todoList.deleteTask(1)).toBe(false);
            expect(todoList.updateTask(1, 'text')).toBe(false);
            expect(todoList.getTaskById(1)).toBeNull();
            expect(todoList.clearCompletedTasks()).toBe(0);
        });

        test('should handle multiple rapid additions', () => {
            for (let i = 0; i < 100; i++) {
                todoList.addTask(`Task ${i}`);
            }
            
            expect(todoList.tasks).toHaveLength(100);
            expect(new Set(todoList.tasks.map(t => t.id)).size).toBe(100); // All IDs should be unique
        });

        test('should preserve task order', () => {
            todoList.addTask('First');
            todoList.addTask('Second');
            todoList.addTask('Third');
            
            expect(todoList.tasks[0].text).toBe('First');
            expect(todoList.tasks[1].text).toBe('Second');
            expect(todoList.tasks[2].text).toBe('Third');
        });
    });

    describe('LocalStorage Integration', () => {
        test('should handle localStorage unavailable gracefully', () => {
            // Temporarily remove localStorage
            const originalLocalStorage = global.localStorage;
            delete global.localStorage;
            
            const todoListWithoutStorage = new TodoListLogic();
            
            expect(todoListWithoutStorage.loadTasks()).toEqual([]);
            expect(() => todoListWithoutStorage.saveTasks()).not.toThrow();
            expect(() => todoListWithoutStorage.addTask('Test')).not.toThrow();
            
            // Restore localStorage
            global.localStorage = originalLocalStorage;
        });

        test('should handle corrupt localStorage data', () => {
            localStorageMock.getItem.mockReturnValue('invalid json');
            
            expect(() => todoList.loadTasks()).toThrow();
        });
    });
});