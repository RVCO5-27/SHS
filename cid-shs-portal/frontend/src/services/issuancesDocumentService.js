import api from './api';

/**
 * Issuances document helpers.
 * Now connected to the real backend API.
 */

export async function fetchFolders() {
  // Returns both unique series years and custom folders for browsing
  try {
    const [{ data: years }, { data: folders }] = await Promise.all([
      api.get('/issuances/years'),
      api.get('/issuances/folders')
    ]);
    
    const yearFolders = (years || []).map(year => ({ 
      id: `year-${year}`, 
      label: year.toString(), 
      type: 'year',
      value: year,
      level: 0
    }));
    
    // Build tree then flatten for simple list display with indentation
    const buildTree = (list, parentId = null, level = 0) => {
      let tree = [];
      list.filter(f => f.parent_id === parentId).forEach(f => {
        tree.push({
          id: `folder-${f.id}`,
          label: f.name,
          type: 'folder',
          value: f.id,
          level: level
        });
        tree = [...tree, ...buildTree(list, f.id, level + 1)];
      });
      return tree;
    };

    const customFolders = buildTree(folders || []);

    return [...customFolders, ...yearFolders];
  } catch (err) {
    console.error('Error fetching folders:', err);
    throw err;
  }
}

export async function fetchFilesForFolder(folderObj) {
  // folderObj can be a string (id) or the folder object from fetchFolders
  try {
    let url = '/issuances';
    if (typeof folderObj === 'string') {
      if (folderObj.startsWith('year-')) {
        url += `?series_year=${folderObj.replace('year-', '')}`;
      } else if (folderObj.startsWith('folder-')) {
        url += `?folder_id=${folderObj.replace('folder-', '')}`;
      } else {
        // Fallback for old calls
        url += `?series_year=${folderObj}`;
      }
    } else if (folderObj?.type === 'year') {
      url += `?series_year=${folderObj.value}`;
    } else if (folderObj?.type === 'folder') {
      url += `?folder_id=${folderObj.value}`;
    }

    const { data } = await api.get(url);
    return (data || []).map(item => ({
      id: item.id,
      name: item.title,
      doc_number: item.doc_number,
      category: item.category_name,
      category_prefix: item.category_prefix,
      date: item.date_issued || item.created_at,
      file_path: item.file_path ? item.file_path.replace(/^\/uploads\//, '') : '',
      tags: item.tags,
      size: 'PDF',
      type: 'pdf'
    }));
  } catch (err) {
    console.error('Error fetching files for folder:', err);
    throw err;
  }
}

export async function searchDocuments(params = {}) {
  try {
    const { q, schoolYear, category_id } = params;
    let url = `/issuances?q=${q || ''}`;
    if (schoolYear) url += `&series_year=${schoolYear}`;
    if (category_id) url += `&category_id=${category_id}`;

    const { data } = await api.get(url);
    return (data || []).map(item => ({
      id: item.id,
      name: item.title,
      doc_number: item.doc_number,
      category: item.category_name,
      category_prefix: item.category_prefix,
      date: item.date_issued || item.created_at,
      // Strip /uploads/ prefix if it exists for compatibility with old UI manual prepending
      file_path: item.file_path ? item.file_path.replace(/^\/uploads\//, '') : '',
      tags: item.tags,
      size: 'PDF', // placeholder since DB doesn't track size
      type: 'pdf'
    }));
  } catch (err) {
    console.error('Error searching documents:', err);
    throw err;
  }
}

export async function fetchCategories() {
  try {
    const { data } = await api.get('/issuances/categories');
    return data || [];
  } catch (err) {
    console.error('Error fetching categories:', err);
    throw err;
  }
}

export async function deleteDocument(documentId) {
  // Not used in public view, but kept for admin if needed
  try {
    await api.delete(`/admin/issuances-mgmt/issuances/${documentId}`);
  } catch (err) {
    console.error('Error deleting document:', err);
    throw err;
  }
}

export async function fetchAdminIssuances(params = {}) {
  try {
    const { data } = await api.get('/admin/issuances-mgmt/issuances', { params });
    return data;
  } catch (err) {
    console.error('Error fetching admin issuances:', err);
    throw err;
  }
}

export async function createDocument(formData) {
  try {
    const { data } = await api.post('/admin/issuances-mgmt/issuances', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  } catch (err) {
    console.error('Error creating document:', err);
    throw err;
  }
}

export async function fetchAdminFolders(params = {}) {
  try {
    const { data } = await api.get('/admin/issuances-mgmt/folders', { params });
    return data;
  } catch (err) {
    console.error('Error fetching admin folders:', err);
    throw err;
  }
}

export async function createFolder(folderData) {
  try {
    const { data } = await api.post('/admin/issuances-mgmt/folders', folderData);
    return data;
  } catch (err) {
    console.error('Error creating folder:', err);
    throw err;
  }
}

export async function updateFolder(id, folderData) {
  try {
    const { data } = await api.put(`/admin/issuances-mgmt/folders/${id}`, folderData);
    return data;
  } catch (err) {
    console.error('Error updating folder:', err);
    throw err;
  }
}

export async function deleteFolder(id) {
  try {
    const { data } = await api.delete(`/admin/issuances-mgmt/folders/${id}`);
    return data;
  } catch (err) {
    console.error('Error deleting folder:', err);
    throw err;
  }
}

export async function updateDocument(id, formData) {
  try {
    const { data } = await api.put(`/admin/issuances-mgmt/issuances/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  } catch (err) {
    console.error('Error updating document:', err);
    throw err;
  }
}

