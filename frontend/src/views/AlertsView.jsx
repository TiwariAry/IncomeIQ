import React from 'react';
import { Bell, ArrowRight, BellOff, X } from 'lucide-react';

const AlertsView = ({ user, alerts, alertForm, setAlertForm, handleAddAlert, handleToggleAlert, handleDeleteAlert }) => {
    return (
        <div className="app-container">
            <div className="alerts-header">
                <h1 className="page-title"><Bell size={40} /> Investment Alerts</h1>
                <p className="page-subtitle">Set up custom alerts to stay informed. Notifications sent to <strong>{user?.email || 'your email'}</strong></p>
            </div>

            <div className="alerts-content">
                <div className="alert-form-card glass-card">
                    <h2 className="card-title">Create New Alert</h2>
                    <form onSubmit={handleAddAlert} className="alert-form">
                        <div className="form-grid">
                            <div className="form-group"><label className="form-label">Alert Type</label><select className="form-select" value={alertForm.type} onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}><option value="price">Price Alert</option><option value="performance">Performance Alert</option></select></div>
                            <div className="form-group"><label className="form-label">Asset/Stock</label><input type="text" className="form-input" placeholder="e.g., AAPL" value={alertForm.asset} onChange={(e) => setAlertForm({ ...alertForm, asset: e.target.value })} required /></div>
                            <div className="form-group"><label className="form-label">Condition</label><select className="form-select" value={alertForm.condition} onChange={(e) => setAlertForm({ ...alertForm, condition: e.target.value })}><option value="above">Above</option><option value="below">Below</option></select></div>
                            <div className="form-group"><label className="form-label">Target Value</label><input type="number" className="form-input" placeholder="Enter value" value={alertForm.value} onChange={(e) => setAlertForm({ ...alertForm, value: e.target.value })} required /></div>
                        </div>
                        <button type="submit" className="generate-button active"><Bell size={20} /> Save Alert <ArrowRight size={20} /></button>
                    </form>
                </div>

                <div className="alerts-list-card glass-card">
                    <h2 className="card-title">Active Alerts ({alerts.length})</h2>
                    {alerts.length === 0 ? (
                        <div className="empty-state"><BellOff size={48} className="empty-icon" /><p>No alerts configured yet</p></div>
                    ) : (
                        <div className="alerts-list">
                            {alerts.map((alert) => (
                                <div key={alert.id} className={`alert-item ${alert.enabled ? 'enabled' : 'disabled'}`}>
                                    <div className="alert-item-header">
                                        <div className="alert-item-type"><Bell size={20} /><span>{alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert</span></div>
                                        <button type="button" className={`alert-toggle ${alert.enabled ? 'active' : ''}`} onClick={() => handleToggleAlert(alert.id)}>{alert.enabled ? <Bell size={18} /> : <BellOff size={18} />}</button>
                                    </div>
                                    <div className="alert-item-details"><div className="alert-detail"><span className="alert-label">Asset:</span><span className="alert-value">{alert.asset}</span></div><div className="alert-detail"><span className="alert-label">Condition:</span><span className="alert-value">{alert.condition} {alert.value}</span></div></div>
                                    <div className="alert-item-footer">
                                        <span className="alert-date">Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                                        <button type="button" className="alert-delete-btn" onClick={() => handleDeleteAlert(alert.id)}><X size={16} /> Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertsView;