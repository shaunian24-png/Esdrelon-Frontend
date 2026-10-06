import { useCallback, useEffect, useState } from 'react';
import { ProductAPI, parseError } from '../api.js';
import ProductForm from './ProductForm.jsx';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const PER_PAGE = 10;

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ProductsPage({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | product object

  // Wait until the user stops typing before calling the API.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ProductAPI.list({ search, page, per_page: PER_PAGE });
      setProducts(res.data);
      setMeta(res.meta);
      // Deleted the last item on the last page? Step back.
      if (res.data.length === 0 && res.meta.page > 1) setPage(res.meta.page - 1);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const handleSaved = (message) => {
    setEditing(null);
    setNotice(message);
    load();
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.product_name}"? This cannot be undone.`)) return;
    try {
      const res = await ProductAPI.remove(product.id);
      setNotice(res.message || 'Product deleted.');
      load();
    } catch (err) {
      setError(parseError(err).message);
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <h1>Product Management</h1>
        <div className="topbar-right">
          <span className="muted">Signed in as <strong>{user.username}</strong></span>
          <button className="btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main>
        <div className="toolbar">
          <input
            className="search"
            type="search"
            placeholder="Search products…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button className="btn primary" onClick={() => setEditing('new')}>+ Add product</button>
        </div>

        {notice && <div className="alert success">{notice}</div>}
        {error && <div className="alert error">{error}</div>}

        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Description</th>
                <th className="num">Price</th>
                <th className="num">Qty</th>
                <th>Created</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {loading && products.length === 0 && (
                <tr><td colSpan={7} className="empty">Loading…</td></tr>
              )}
              {!loading && products.length === 0 && !error && (
                <tr><td colSpan={7} className="empty">
                  {search ? 'No products match your search.' : 'No products yet. Click “Add product” to create one.'}
                </td></tr>
              )}
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td className="strong">{p.product_name}</td>
                  <td className="desc">{p.description || <span className="muted">—</span>}</td>
                  <td className="num">{peso.format(p.price)}</td>
                  <td className="num">{p.quantity}</td>
                  <td className="muted nowrap">{formatDate(p.created_at)}</td>
                  <td className="nowrap">
                    <button className="btn small" onClick={() => setEditing(p)}>Edit</button>{' '}
                    <button className="btn small danger" onClick={() => handleDelete(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <span className="muted">{meta.total} product{meta.total === 1 ? '' : 's'}</span>
          <div>
            <button className="btn small" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>← Prev</button>
            <span className="page-num">Page {meta.page} of {meta.total_pages}</span>
            <button className="btn small" disabled={page >= meta.total_pages || loading} onClick={() => setPage(page + 1)}>Next →</button>
          </div>
        </div>
      </main>

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
