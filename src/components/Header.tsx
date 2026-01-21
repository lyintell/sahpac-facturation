import { FileText, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import sahpacLogo from '@/assets/sahpac-logo.png';

interface HeaderProps {
  activeTab: 'invoices' | 'clients' | 'new';
  onTabChange: (tab: 'invoices' | 'clients' | 'new') => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  return (
    <header className="bg-primary text-primary-foreground shadow-elevated">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-2">
              <img src={sahpacLogo} alt="SAHPAC Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">SAHPAC</h1>
              <p className="text-sm opacity-90">Gestion des Factures</p>
            </div>
          </div>
          
          <nav className="flex gap-2">
            <Button
              variant={activeTab === 'invoices' ? 'secondary' : 'ghost'}
              onClick={() => onTabChange('invoices')}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Factures
            </Button>
            <Button
              variant={activeTab === 'clients' ? 'secondary' : 'ghost'}
              onClick={() => onTabChange('clients')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Clients
            </Button>
            <Button
              variant="ghost"
              onClick={() => onTabChange('new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Facture
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
