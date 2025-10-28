const urlBase = "https://ocgpvepw4j.execute-api.us-east-2.amazonaws.com";

export async function get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${urlBase}/${endpoint}`);
    return response.ok 
        ? response.json().then(data => data).catch(() => null) 
        : response.text().then(err => Promise.reject(err));
}

export async function post<T>(endpoint: string, objeto: T): Promise<void> {
    const response = await fetch(`${urlBase}/${endpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json;charset=UTF-8' },
        body: JSON.stringify(objeto)
    });
    return response.ok ? Promise.resolve() : response.text().then(err => Promise.reject(err));
}

export async function postRetornoId<T>(endpoint: string, objeto: T): Promise<number> {
    const response = await fetch(`${urlBase}/${endpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json;charset=UTF-8' },
        body: JSON.stringify(objeto)
    });
    return response.text().then(n => response.ok ? Number(n) : Promise.reject(n));
}

export async function del(endpoint: string, Id: number): Promise<void> {
    const response = await fetch(`${urlBase}/${endpoint}/${Id}`, { method: 'DELETE' });
    return response.ok ? Promise.resolve() : response.text().then(err => Promise.reject(err));
}