const getCardColor = (rank, totalPlayers) => {
  if (totalPlayers === 0) return { gradient: "linear-gradient(135deg, #2a2d3a, #1f212b)", firstColor: "#2a2d3a" };

  const percentile = (rank / totalPlayers) ;

  if (percentile <= 0.1) {
      return { 
          gradient: "linear-gradient(65deg,rgba(255, 217, 0, 0.46), #C27E00,rgb(126, 109, 16), #8B6A00)", 
          firstColor: "#FFD700" 
      };
  } 
  else if (percentile <= 0.37) {
      return { 
          gradient: "linear-gradient(65deg,rgba(192, 192, 192, 0.8), #A8A8A8, #E0E0E0,#b0b0b0)", 
          firstColor: "#C0C0C0"
      };
  } 
  else if (percentile <= 0.7) {
      return { 
          gradient: "linear-gradient(65deg,#3282cd,rgba(139, 89, 43, 0.77),#999c9c,#304b61)", 
          firstColor: "#b0b0b0"
      };
  } 
  
  return { 
      gradient: "linear-gradient(65deg,rgb(219, 219, 219),rgb(0, 0, 0),rgb(37, 35, 35),rgb(139, 139, 139))", 
      firstColor: "#FFFFFF"
  };
};

module.exports = getCardColor;
