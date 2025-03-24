// Helper function to add sections to the analysis results
function addSection(container, title, content) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'mb-4';
    
    const sectionTitle = document.createElement('h4');
    sectionTitle.className = 'text-lg font-medium mb-2';
    sectionTitle.textContent = title;
    sectionDiv.appendChild(sectionTitle);
    
    if (content) {
        const sectionContent = document.createElement('div');
        sectionContent.className = 'text-gray-700';
        sectionContent.innerHTML = content;
        sectionDiv.appendChild(sectionContent);
    }
    
    container.appendChild(sectionDiv);
    return sectionDiv;
}

function handleAIAnalysisResponse(response) {
    console.log("AI Analysis Response received:", response);
    
    // Clear previous content
    const analysisContainer = document.getElementById('analysis-results');
    analysisContainer.innerHTML = '';
    
    // We need to look for either response.analysis (structure from API) or just use response directly (if passed from another function)
    const analysisData = response.analysis || response;
    
    console.log("Using analysis data:", analysisData);
    
    // Check if there is analysis data
    if (analysisData) {
        // Create title
        const title = document.createElement('h3');
        title.className = 'text-xl font-semibold mb-4';
        title.textContent = 'Hukuki Analiz';
        analysisContainer.appendChild(title);
        
        // Check if using mock data and display appropriate message
        if (response.metadata && response.metadata.using_mock_data) {
            const mockWarning = document.createElement('div');
            mockWarning.className = 'p-3 mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700';
            mockWarning.innerHTML = '<strong>Bilgi:</strong> Gerçek AI analizi yerine örnek veri kullanılıyor. API yanıtı alınamadı.';
            analysisContainer.appendChild(mockWarning);
        } else {
            const aiNotice = document.createElement('div');
            aiNotice.className = 'p-3 mb-4 bg-green-100 border-l-4 border-green-500 text-green-700';
            aiNotice.innerHTML = '<strong>Başarılı:</strong> Bu analiz yapay zeka tarafından oluşturulmuştur.';
            analysisContainer.appendChild(aiNotice);
        }
        
        // Add summary if it exists
        if (analysisData.summary) {
            addSection(analysisContainer, 'Özet', analysisData.summary);
        }
        
        // Add relevant laws
        if (analysisData.relevant_laws && analysisData.relevant_laws.length > 0) {
            const lawsContainer = addSection(analysisContainer, 'İlgili Kanunlar', '');
            const lawsList = document.createElement('ul');
            lawsList.className = 'list-disc pl-5 space-y-2';
            
            analysisData.relevant_laws.forEach(law => {
                console.log("Processing law object:", law);
                
                // Handle potential missing fields with fallbacks
                let lawTitle = "Kanun";
                let lawDescription = "Bilgi bulunamadı";
                
                // First, make sure law is actually an object
                if (typeof law !== 'object' || law === null) {
                    console.warn("Law is not an object:", law);
                    law = {
                        title: "Geçersiz veri",
                        description: "Hatalı veri formatı: " + JSON.stringify(law)
                    };
                }
                
                // Check for title in various possible fields
                if (law.title) lawTitle = law.title;
                else if (law.name) lawTitle = law.name;
                else if (law.law_name) lawTitle = law.law_name;
                
                // Check for description in various possible fields
                if (law.description) lawDescription = law.description;
                else if (law.content) lawDescription = law.content;
                else if (law.text) lawDescription = law.text;
                
                // Debug - log what we found
                console.log("Law data:", {
                    original: law,
                    title_used: lawTitle,
                    description_used: lawDescription
                });
                
                const lawItem = document.createElement('li');
                lawItem.innerHTML = `<strong>${lawTitle || "Kanun"}:</strong> ${lawDescription || "İçerik bulunamadı"}`;
                lawsList.appendChild(lawItem);
            });
            
            lawsContainer.appendChild(lawsList);
        }
        
        // Add relevant court decisions
        if (analysisData.relevant_decisions && analysisData.relevant_decisions.length > 0) {
            const decisionsContainer = addSection(analysisContainer, 'İlgili Yargıtay Kararları', '');
            const decisionsList = document.createElement('ul');
            decisionsList.className = 'list-disc pl-5 space-y-2';
            
            analysisData.relevant_decisions.forEach(decision => {
                console.log("Processing decision object:", decision);
                
                // First, make sure decision is actually an object
                if (typeof decision !== 'object' || decision === null) {
                    console.warn("Decision is not an object:", decision);
                    decision = {
                        case_number: "Geçersiz veri",
                        date: "Belirsiz",
                        summary: "Hatalı veri formatı: " + JSON.stringify(decision)
                    };
                }
                
                // Handle potential missing fields with fallbacks
                let caseNumber = "Belirsiz";
                let date = "Belirsiz";
                let summary = "Detay bulunamadı";
                
                // Check for case number in various possible fields
                if (decision.case_number) caseNumber = decision.case_number;
                else if (decision.number) caseNumber = decision.number;
                else if (decision.court && decision.court.number) caseNumber = decision.court.number;
                
                // Check for date in various possible fields
                if (decision.date) date = decision.date;
                else if (decision.decision_date) date = decision.decision_date;
                
                // Check for summary in various possible fields
                if (decision.summary) summary = decision.summary;
                else if (decision.content) summary = decision.content;
                else if (decision.text) summary = decision.text;
                else if (decision.description) summary = decision.description;
                
                // Debug - log what we found
                console.log("Decision data:", {
                    original: decision,
                    case_number_used: caseNumber,
                    date_used: date,
                    summary_used: summary
                });
                
                const decisionItem = document.createElement('li');
                decisionItem.innerHTML = `<strong>${caseNumber || "Belirsiz"} (${date || "Belirsiz"}):</strong> ${summary || "Detay bulunamadı"}`;
                decisionsList.appendChild(decisionItem);
            });
            
            decisionsContainer.appendChild(decisionsList);
        }
        
        // Add recommendations if they exist
        if (analysisData.recommendations) {
            addSection(analysisContainer, 'Öneriler', analysisData.recommendations);
        }
        
        // Make sure the container is visible
        analysisContainer.style.display = 'block';
    } else {
        console.warn("No analysis data found in response:", response);
        analysisContainer.innerHTML = '<div class="alert alert-warning">Analiz sonuçları bulunamadı.</div>';
    }
} 