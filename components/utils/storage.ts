class Storage {
    async setItem(key: string, value: string) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.error('Error saving data', error);
        }
    }

    async getItem(key: string): Promise<string | null> {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error('Error reading data', error);
            return null;
        }
    }

    async removeItem(key: string) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing data', error);
        }
    }
}

export default new Storage(); 