import { useState } from 'react';
import { ProductAPI, parseError } from '../api.js';

const empty = { product_name: '', description: '', price: '', quantity: '' };

/** Modal used for both "Add product" (product = null) and "Edit product". */
export default function ProductForm({ product, onClose, onSaved }) {
  const editing = Boolean(product);
  const [form, setForm] = useState(
    editing
      ? {
          product_name: product.product_name,
          description: product.description ?? '',
          price: String(product.price),
          quantity: String(product.quantity),
        }
      : empty
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFields({});

    const payload = {
      product_name: form.product_name.trim(),
      description: form.description.trim(),
      price: form.price,
      quantity: form.quantity,
    };

    try {
      const res = editing
        ? await ProductAPI.update(product.id, payload)
        : await ProductAPI.create(payload);
      onSaved(res.message || 'Saved.');
    } catch (err) {
      const parsed = parseError(err);
      setError(parsed.message);
      setFields(parsed.fields);
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="card modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()} noValidate>
        <h2>{editing ? 'Edit product' : 'Add product'}</h2>

        {error && <div className="alert error">{error}</div>}

        <label>
          Product name
          <input value={form.product_name} onChange={update('product_name')} maxLength={100} autoFocus required />
          {fields.product_name && <span className="field-error">{fields.product_name}</span>}
        </label>

        <label>
          Description
          <textarea rows={3} value={form.description} onChange={update('description')} />
          {fields.description && <span className="field-error">{fields.description}</span>}
        </label>

        <div className="row">
          <label>
            Price (₱)
            <input type="number" step="0.01" min="0" value={form.price} onChange={update('price')} required />
            {fields.price && <span className="field-error">{fields.price}</span>}
          </label>
          <label>
            Quantity
            <input type="number" step="1" min="0" value={form.quantity} onChange={update('quantity')} required />
            {fields.quantity && <span className="field-error">{fields.quantity}</span>}
          </label>
        </div>

        <div className="actions">
          <button type="button" className="btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </form>
    </div>
  );
}
