/**
 * TodoList Logic Module
 * Extracted from jekyll-site/index.html for unit testing
 */

class TodoListLogic {
    constructor() {
        this.tasks = [];
        this.nextId = Date.now();
    }

    /**
     * Load tasks from localStorage or return empty array
     * @returns {Array} Array of task objects
     */
    loadTasks() {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('todoTasks');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    }

    /**
     * Save tasks to localStorage
     */
    saveTasks() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
        }
    }

    /**
     * Add a new task
     * @param {string} text - The task text
     * @returns {boolean} True if task was added, false if text is empty/invalid
     */
    addTask(text) {
        const trimmedText = text ? text.trim() : '';
        if (trimmedText) {
            this.tasks.push({
                id: this.nextId++,
                text: trimmedText,
                completed: false
            });
            this.saveTasks();
            return true;
        }
        return false;
    }

    /**
     * Toggle task completion status
     * @param {number} id - Task ID
     * @returns {boolean} True if task was found and toggled, false otherwise
     */
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            return true;
        }
        return false;
    }

    /**
     * Delete a task
     * @param {number} id - Task ID
     * @returns {boolean} True if task was found and deleted, false otherwise
     */
    deleteTask(id) {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(t => t.id !== id);
        const deleted = this.tasks.length < initialLength;
        if (deleted) {
            this.saveTasks();
        }
        return deleted;
    }

    /**
     * Get all tasks
     * @returns {Array} Array of all tasks
     */
    getAllTasks() {
        return [...this.tasks];
    }

    /**
     * Get completed tasks
     * @returns {Array} Array of completed tasks
     */
    getCompletedTasks() {
        return this.tasks.filter(task => task.completed);
    }

    /**
     * Get pending tasks
     * @returns {Array} Array of pending (not completed) tasks
     */
    getPendingTasks() {
        return this.tasks.filter(task => !task.completed);
    }

    /**
     * Clear all tasks
     */
    clearAllTasks() {
        this.tasks = [];
        this.saveTasks();
    }

    /**
     * Clear completed tasks
     * @returns {number} Number of tasks cleared
     */
    clearCompletedTasks() {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(task => !task.completed);
        const cleared = initialLength - this.tasks.length;
        if (cleared > 0) {
            this.saveTasks();
        }
        return cleared;
    }

    /**
     * Get task by ID
     * @param {number} id - Task ID
     * @returns {Object|null} Task object or null if not found
     */
    getTaskById(id) {
        return this.tasks.find(t => t.id === id) || null;
    }

    /**
     * Update task text
     * @param {number} id - Task ID
     * @param {string} newText - New task text
     * @returns {boolean} True if task was found and updated, false otherwise
     */
    updateTask(id, newText) {
        const task = this.tasks.find(t => t.id === id);
        const trimmedText = newText ? newText.trim() : '';
        if (task && trimmedText) {
            task.text = trimmedText;
            this.saveTasks();
            return true;
        }
        return false;
    }

    /**
     * Get task count statistics
     * @returns {Object} Object with total, completed, and pending counts
     */
    getTaskStats() {
        const total = this.tasks.length;
        const completed = this.getCompletedTasks().length;
        const pending = total - completed;
        return { total, completed, pending };
    }

    /**
     * Initialize with tasks from storage
     */
    initialize() {
        this.tasks = this.loadTasks();
    }

    /**
     * Escape HTML characters in text
     * @param {string} text - Text to escape
     * @returns {string} HTML-escaped text
     */
    static escapeHtml(text) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;'
        };
        return text.replace(/[&<>"']/g, (match) => escapeMap[match]);
    }
}

// Export for Node.js (testing) and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoListLogic;
} else if (typeof window !== 'undefined') {
    window.TodoListLogic = TodoListLogic;
}