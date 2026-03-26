import { createContext, useContext, useState } from 'react';
import { initialData } from './data';

const CRMContext = createContext(null);

export function CRMProvider({ children }) {
  const [contacts, setContacts] = useState(initialData.contacts);
  const [properties, setProperties] = useState(initialData.properties);
  const [pipeline, setPipeline] = useState(initialData.pipeline);
  const [followups, setFollowups] = useState(initialData.followups);
  const [interactions, setInteractions] = useState(initialData.interactions);

  function addContact(contact) {
    const newContact = { ...contact, id: Date.now() };
    setContacts(prev => [...prev, newContact]);
    return newContact;
  }
  function updateContact(id, data) {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }
  function deleteContact(id) {
    setContacts(prev => prev.filter(c => c.id !== id));
  }

  function addProperty(property) {
    setProperties(prev => [...prev, { ...property, id: Date.now() }]);
  }
  function updateProperty(id, data) {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }
  function deleteProperty(id) {
    setProperties(prev => prev.filter(p => p.id !== id));
  }

  function addDeal(deal) {
    setPipeline(prev => [...prev, { ...deal, id: Date.now(), createdAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] }]);
  }
  function moveDeal(id, stage) {
    setPipeline(prev => prev.map(d => d.id === id ? { ...d, stage, updatedAt: new Date().toISOString().split('T')[0] } : d));
  }
  function deleteDeal(id) {
    setPipeline(prev => prev.filter(d => d.id !== id));
  }

  function addFollowup(followup) {
    setFollowups(prev => [...prev, { ...followup, id: Date.now() }]);
  }
  function toggleFollowup(id) {
    setFollowups(prev => prev.map(f => f.id === id ? { ...f, done: !f.done } : f));
  }
  function deleteFollowup(id) {
    setFollowups(prev => prev.filter(f => f.id !== id));
  }

  function addInteraction(interaction) {
    setInteractions(prev => [...prev, { ...interaction, id: Date.now() }]);
  }

  const value = {
    contacts, properties, pipeline, followups, interactions,
    addContact, updateContact, deleteContact,
    addProperty, updateProperty, deleteProperty,
    addDeal, moveDeal, deleteDeal,
    addFollowup, toggleFollowup, deleteFollowup,
    addInteraction,
  };

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
}

export function useCRM() {
  return useContext(CRMContext);
}
